import { z } from "zod";
import {
  GUARDRAIL_CODE,
  ProposedActionType,
  SupportRequestStatus,
} from "@/constants";
import { executeCancel } from "@/lib/actions";
import { isAutoCancelEligible } from "@/lib/guardrails";
import { Customer, Escalation, Order, SupportRequest } from "@/models";

export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "get_order",
      description:
        "Fetch a single order by numeric order ID, including customer and refund status.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "integer", description: "Numeric order ID, e.g. 1043" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_orders_by_email",
      description: "List orders for a customer email address.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string" },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancel_order",
      description:
        "Attempt to cancel an unshipped order automatically. Guardrails reject shipped/delivered/cancelled orders. Prefer escalate_for_approval when unsure.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "integer" },
          reason: { type: "string" },
        },
        required: ["orderId", "reason"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "escalate_for_approval",
      description:
        "Escalate a proposed mutating action (refund, cancel, replace) to a human reviewer. REQUIRED for all refunds and replacements.",
      parameters: {
        type: "object",
        properties: {
          proposedAction: {
            type: "string",
            enum: ["REFUND", "CANCEL", "REPLACE"],
          },
          orderId: { type: "integer" },
          amountCents: { type: "integer" },
          reason: { type: "string" },
          escalationReason: { type: "string" },
          agentReasoning: { type: "string" },
        },
        required: [
          "proposedAction",
          "orderId",
          "reason",
          "escalationReason",
          "agentReasoning",
        ],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "resolve_without_action",
      description:
        "Close the request without a financial/order mutation (e.g. informational reply, order not found after lookup).",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
    },
  },
];

const getOrderSchema = z.object({ orderId: z.number().int() });
const emailSchema = z.object({ email: z.string().email() });
const cancelSchema = z.object({
  orderId: z.number().int(),
  reason: z.string().min(1),
});
const escalateSchema = z.object({
  proposedAction: z.enum(["REFUND", "CANCEL", "REPLACE"]),
  orderId: z.number().int(),
  amountCents: z.number().int().optional(),
  reason: z.string().min(1),
  escalationReason: z.string().min(1),
  agentReasoning: z.string().min(1),
});
const resolveSchema = z.object({ summary: z.string().min(1) });

export type ToolContext = {
  supportRequestId: string;
  customerId?: string | null;
};

export async function executeTool(
  name: string,
  rawArgs: unknown,
  ctx: ToolContext,
): Promise<unknown> {
  switch (name) {
    case "get_order": {
      const { orderId } = getOrderSchema.parse(rawArgs);
      const order = await Order.findByPk(orderId, {
        include: [
          { model: Customer, as: "customer", attributes: ["id", "email", "name"] },
          { association: "refunds" },
        ],
      });
      if (!order) {
        return { found: false, error: "ORDER_NOT_FOUND", orderId };
      }
      const json = order.toJSON() as Order & {
        customer: { id: string; email: string; name: string };
        refunds: Array<{ id: string }>;
      };
      return {
        found: true,
        order: {
          id: json.id,
          status: json.status,
          totalCents: json.total_cents,
          currency: json.currency,
          items: json.items_json,
          shippedAt: json.shipped_at,
          customer: json.customer,
          refunded: (json.refunds?.length ?? 0) > 0,
          refunds: json.refunds,
          autoCancelEligible: isAutoCancelEligible(json.status),
        },
      };
    }

    case "find_orders_by_email": {
      const { email } = emailSchema.parse(rawArgs);
      const customer = await Customer.findOne({
        where: { email: email.toLowerCase() },
        include: [
          {
            model: Order,
            as: "orders",
            include: [{ association: "refunds" }],
          },
        ],
        order: [[{ model: Order, as: "orders" }, "created_at", "DESC"]],
      });
      if (!customer) {
        return { found: false, error: "CUSTOMER_NOT_FOUND", email };
      }
      const c = customer.toJSON() as Customer & {
        orders: Array<
          Order & { refunds: Array<{ id: string }> }
        >;
      };
      return {
        found: true,
        customer: { id: c.id, email: c.email, name: c.name },
        orders: (c.orders || []).map((o) => ({
          id: o.id,
          status: o.status,
          totalCents: o.total_cents,
          refunded: (o.refunds?.length ?? 0) > 0,
          autoCancelEligible: isAutoCancelEligible(o.status),
        })),
      };
    }

    case "cancel_order": {
      const args = cancelSchema.parse(rawArgs);
      const order = await Order.findByPk(args.orderId);
      if (!order) {
        return {
          ok: false,
          code: GUARDRAIL_CODE.ORDER_NOT_FOUND,
          message: "Order not found",
        };
      }
      if (!isAutoCancelEligible(order.status)) {
        return {
          ok: false,
          code: "NOT_AUTO_ELIGIBLE",
          message:
            "Order is not eligible for autonomous cancellation. Escalate to a human.",
          status: order.status,
        };
      }
      const result = await executeCancel({
        orderId: args.orderId,
        reason: args.reason,
        actingCustomerId: ctx.customerId,
      });
      if (result.ok) {
        await SupportRequest.update(
          {
            status: SupportRequestStatus.AUTO_RESOLVED,
            outcome_summary: `Auto-cancelled order ${args.orderId}: ${args.reason}`,
          },
          { where: { id: ctx.supportRequestId } },
        );
      }
      return result;
    }

    case "escalate_for_approval": {
      const args = escalateSchema.parse(rawArgs);

      if (
        (args.proposedAction === "REFUND" || args.proposedAction === "REPLACE") &&
        (args.amountCents === undefined || args.amountCents === null)
      ) {
        return {
          ok: false,
          code: "AMOUNT_REQUIRED",
          message: "amountCents is required for REFUND and REPLACE proposals.",
        };
      }

      const order = await Order.findByPk(args.orderId, {
        include: [{ association: "refunds" }],
      });
      if (!order) {
        return {
          ok: false,
          code: GUARDRAIL_CODE.ORDER_NOT_FOUND,
          message: "Cannot escalate unknown order.",
        };
      }

      const existing = await Escalation.findOne({
        where: { support_request_id: ctx.supportRequestId },
      });
      if (existing) {
        return {
          ok: false,
          code: GUARDRAIL_CODE.ALREADY_ESCALATED,
          message: "This request already has an escalation.",
          escalationId: existing.id,
        };
      }

      const escalation = await Escalation.create({
        support_request_id: ctx.supportRequestId,
        proposed_action: args.proposedAction as ProposedActionType,
        proposed_payload: {
          orderId: args.orderId,
          amountCents: args.amountCents ?? order.total_cents,
          reason: args.reason,
        },
        agent_reasoning: args.agentReasoning,
        escalation_reason: args.escalationReason,
      });

      await SupportRequest.update(
        {
          status: SupportRequestStatus.ESCALATED,
          outcome_summary: `Escalated: ${args.proposedAction} for order ${args.orderId}`,
          customer_id: ctx.customerId ?? order.customer_id,
        },
        { where: { id: ctx.supportRequestId } },
      );

      return {
        ok: true,
        escalationId: escalation.id,
        message: "Escalated to human reviewer. Do not execute the action yourself.",
      };
    }

    case "resolve_without_action": {
      const args = resolveSchema.parse(rawArgs);
      await SupportRequest.update(
        {
          status: SupportRequestStatus.AUTO_RESOLVED,
          outcome_summary: args.summary,
        },
        { where: { id: ctx.supportRequestId } },
      );
      return { ok: true, summary: args.summary };
    }

    default:
      return { ok: false, code: "UNKNOWN_TOOL", message: `Unknown tool: ${name}` };
  }
}
