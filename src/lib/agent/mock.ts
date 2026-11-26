import { executeTool } from "@/lib/agent/tools";
import { ToolCall } from "@/models";

export async function runMockAgent(input: {
  supportRequestId: string;
  agentRunId: string;
  customerMessage: string;
  customerId?: string | null;
}) {
  const msg = input.customerMessage.toLowerCase();
  const orderMatch = msg.match(/order\s+#?(\d+)/i) || msg.match(/\b(\d{3,5})\b/);
  const orderId = orderMatch ? Number(orderMatch[1]) : null;
  let sequence = 0;

  const record = async (toolName: string, args: unknown, result: unknown) => {
    sequence += 1;
    await ToolCall.create({
      agent_run_id: input.agentRunId,
      sequence,
      tool_name: toolName,
      tool_arguments: args as object,
      result: result as object,
    });
    return result;
  };

  const ctx = {
    supportRequestId: input.supportRequestId,
    customerId: input.customerId,
  };

  if (!orderId) {
    const result = await executeTool(
      "resolve_without_action",
      { summary: "Could not identify an order ID in the customer message." },
      ctx,
    );
    await record("resolve_without_action", { summary: "no order id" }, result);
    return {
      finalOutcome: "resolved_without_action",
      reasoningSummary: "No order ID found in message.",
    };
  }

  const lookup = await executeTool("get_order", { orderId }, ctx);
  await record("get_order", { orderId }, lookup);

  if (
    typeof lookup !== "object" ||
    lookup === null ||
    !("found" in lookup) ||
    !(lookup as { found: boolean }).found
  ) {
    const result = await executeTool(
      "resolve_without_action",
      { summary: `Order ${orderId} does not exist. No action taken.` },
      ctx,
    );
    await record("resolve_without_action", { orderId }, result);
    return {
      finalOutcome: "order_not_found",
      reasoningSummary: `Hallucinated/unknown order ${orderId} rejected.`,
    };
  }

  const order = (
    lookup as unknown as {
      order: { totalCents: number; status: string; autoCancelEligible: boolean };
    }
  ).order;

  if (msg.includes("refund") || msg.includes("damaged") || msg.includes("replacement")) {
    const proposedAction =
      msg.includes("damaged") || msg.includes("replacement") ? "REPLACE" : "REFUND";
    const args = {
      proposedAction,
      orderId,
      amountCents: order.totalCents,
      reason: input.customerMessage.slice(0, 200),
      escalationReason:
        proposedAction === "REPLACE"
          ? "Damaged/replacement requests always require human review."
          : "Refunds always require human approval.",
      agentReasoning: `Customer asked for ${proposedAction.toLowerCase()} on order ${orderId} (status=${order.status}, total=${order.totalCents}). Escalating per policy.`,
    };
    const result = await executeTool("escalate_for_approval", args, ctx);
    await record("escalate_for_approval", args, result);
    return {
      finalOutcome: "escalated",
      reasoningSummary: args.agentReasoning,
    };
  }

  if (msg.includes("cancel")) {
    if (order.autoCancelEligible) {
      const args = {
        orderId,
        reason: "Customer requested cancellation; order not shipped.",
      };
      const result = await executeTool("cancel_order", args, ctx);
      await record("cancel_order", args, result);
      return {
        finalOutcome: "auto_cancelled",
        reasoningSummary: `Auto-cancelled unshipped order ${orderId}.`,
      };
    }
    const args = {
      proposedAction: "CANCEL" as const,
      orderId,
      reason: "Customer requested cancellation after ship/delivery window.",
      escalationReason: "Order already shipped or delivered; cannot auto-cancel.",
      agentReasoning: `Order ${orderId} status=${order.status}. Escalating cancellation/refund decision.`,
    };
    const result = await executeTool("escalate_for_approval", args, ctx);
    await record("escalate_for_approval", args, result);
    return {
      finalOutcome: "escalated",
      reasoningSummary: args.agentReasoning,
    };
  }

  const result = await executeTool(
    "resolve_without_action",
    { summary: "Request acknowledged; no clear refund/cancel action detected." },
    ctx,
  );
  await record("resolve_without_action", {}, result);
  return {
    finalOutcome: "resolved_without_action",
    reasoningSummary: "No clear action detected.",
  };
}
