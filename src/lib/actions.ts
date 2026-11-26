import { QueryTypes, UniqueConstraintError } from "sequelize";
import type { Transaction } from "sequelize";
import {
  EscalationStatus,
  GUARDRAIL_CODE,
  OrderStatus,
  ProposedActionType,
  RefundStatus,
  SupportRequestStatus,
} from "@/constants";
import { sequelize } from "@/lib/db";
import {
  GuardrailError,
  assertCancelAllowed,
  assertRefundAllowed,
} from "@/lib/guardrails";
import { Escalation, Order, Refund, SupportRequest } from "@/models";

export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; code: string; message: string };

export async function executeRefund(input: {
  orderId: number;
  amountCents: number;
  reason: string;
  requestId?: string;
  actingCustomerId?: string | null;
}): Promise<ActionResult> {
  try {
    return await sequelize.transaction(async (tx) =>
      executeRefundInTx(tx, input),
    );
  } catch (err) {
    if (err instanceof GuardrailError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }
}

export async function executeCancel(input: {
  orderId: number;
  reason: string;
  actingCustomerId?: string | null;
}): Promise<ActionResult> {
  try {
    return await sequelize.transaction(async (tx) =>
      executeCancelInTx(tx, input),
    );
  } catch (err) {
    if (err instanceof GuardrailError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }
}

export async function approveEscalation(input: {
  escalationId: string;
  reviewer: string;
}): Promise<ActionResult> {
  try {
    return await sequelize.transaction(async (tx) => {
      const rows = await sequelize.query<{
        id: string;
        support_request_id: string;
        proposed_action: ProposedActionType;
        proposed_payload: {
          orderId: number;
          amountCents?: number;
          reason?: string;
        };
        version: number;
      }>(
        `
        UPDATE escalations
        SET
          status = :approved,
          resolved_by = :reviewer,
          resolved_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = :id
          AND status = :pending
        RETURNING
          id,
          support_request_id,
          proposed_action,
          proposed_payload,
          version
        `,
        {
          replacements: {
            id: input.escalationId,
            reviewer: input.reviewer,
            approved: EscalationStatus.APPROVED,
            pending: EscalationStatus.PENDING,
          },
          transaction: tx,
          type: QueryTypes.SELECT,
        },
      );

      if (!rows.length) {
        const current = await Escalation.findByPk(input.escalationId, {
          transaction: tx,
        });
        return {
          ok: false as const,
          code: GUARDRAIL_CODE.ALREADY_RESOLVED,
          message: current
            ? `Escalation already ${current.status.toLowerCase()}.`
            : "Escalation not found.",
        };
      }

      const esc = rows[0];
      const payload = esc.proposed_payload;
      const request = await SupportRequest.findByPk(esc.support_request_id, {
        transaction: tx,
      });

      let actionResult: ActionResult;

      if (esc.proposed_action === ProposedActionType.REFUND) {
        actionResult = await executeRefundInTx(tx, {
          orderId: payload.orderId,
          amountCents: payload.amountCents ?? 0,
          reason: payload.reason ?? "Approved by reviewer",
          requestId: esc.support_request_id,
          actingCustomerId: request?.customer_id,
        });
      } else if (esc.proposed_action === ProposedActionType.CANCEL) {
        actionResult = await executeCancelInTx(tx, {
          orderId: payload.orderId,
          reason: payload.reason ?? "Approved by reviewer",
          actingCustomerId: request?.customer_id,
        });
      } else if (esc.proposed_action === ProposedActionType.REPLACE) {
        actionResult = await executeRefundInTx(tx, {
          orderId: payload.orderId,
          amountCents: payload.amountCents ?? 0,
          reason: payload.reason ?? "Replacement approved (refund proxy)",
          requestId: esc.support_request_id,
          actingCustomerId: request?.customer_id,
        });
      } else {
        actionResult = {
          ok: false,
          code: GUARDRAIL_CODE.UNKNOWN_ACTION,
          message: `Unknown proposed action: ${esc.proposed_action}`,
        };
      }

      if (!actionResult.ok) {
        throw new GuardrailError(actionResult.code, actionResult.message);
      }

      await SupportRequest.update(
        {
          status: SupportRequestStatus.APPROVED,
          outcome_summary: `Approved by ${input.reviewer}: ${esc.proposed_action}`,
        },
        { where: { id: esc.support_request_id }, transaction: tx },
      );

      return {
        ok: true as const,
        data: { escalation: esc, action: actionResult.data },
      };
    });
  } catch (err) {
    if (err instanceof GuardrailError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }
}

export async function rejectEscalation(input: {
  escalationId: string;
  reviewer: string;
}): Promise<ActionResult> {
  const rows = await sequelize.query<{
    id: string;
    support_request_id: string;
  }>(
    `
    UPDATE escalations
    SET
      status = :rejected,
      resolved_by = :reviewer,
      resolved_at = NOW(),
      version = version + 1,
      updated_at = NOW()
    WHERE id = :id
      AND status = :pending
    RETURNING id, support_request_id
    `,
    {
      replacements: {
        id: input.escalationId,
        reviewer: input.reviewer,
        rejected: EscalationStatus.REJECTED,
        pending: EscalationStatus.PENDING,
      },
      type: QueryTypes.SELECT,
    },
  );

  if (!rows.length) {
    const current = await Escalation.findByPk(input.escalationId);
    return {
      ok: false,
      code: GUARDRAIL_CODE.ALREADY_RESOLVED,
      message: current
        ? `Escalation already ${current.status.toLowerCase()}.`
        : "Escalation not found.",
    };
  }

  await SupportRequest.update(
    {
      status: SupportRequestStatus.REJECTED,
      outcome_summary: `Rejected by ${input.reviewer}`,
    },
    { where: { id: rows[0].support_request_id } },
  );

  return {
    ok: true,
    data: { id: rows[0].id, status: EscalationStatus.REJECTED },
  };
}

async function executeRefundInTx(
  tx: Transaction,
  input: {
    orderId: number;
    amountCents: number;
    reason: string;
    requestId?: string;
    actingCustomerId?: string | null;
  },
): Promise<ActionResult> {
  const rows = await sequelize.query<{
    id: number;
    status: OrderStatus;
    total_cents: number;
    customer_id: string;
  }>(
    `
    SELECT id, status, total_cents, customer_id
    FROM orders
    WHERE id = :orderId
    FOR UPDATE
    `,
    {
      replacements: { orderId: input.orderId },
      transaction: tx,
      type: QueryTypes.SELECT,
    },
  );

  if (!rows.length) {
    return {
      ok: false,
      code: GUARDRAIL_CODE.ORDER_NOT_FOUND,
      message: `Order ${input.orderId} not found.`,
    };
  }

  const order = rows[0];
  const existing = await Refund.findOne({
    where: { order_id: input.orderId },
    transaction: tx,
  });

  try {
    assertRefundAllowed({
      orderStatus: order.status,
      orderTotalCents: order.total_cents,
      amountCents: input.amountCents,
      existingRefund: Boolean(existing),
      orderCustomerId: order.customer_id,
      actingCustomerId: input.actingCustomerId,
    });
  } catch (err) {
    if (err instanceof GuardrailError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }

  try {
    const refund = await Refund.create(
      {
        order_id: input.orderId,
        amount_cents: input.amountCents,
        status: RefundStatus.COMPLETED,
        reason: input.reason,
        request_id: input.requestId ?? null,
      },
      { transaction: tx },
    );
    return { ok: true, data: refund.toJSON() };
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return {
        ok: false,
        code: GUARDRAIL_CODE.ALREADY_REFUNDED,
        message: "Concurrent refund rejected — order already refunded.",
      };
    }
    throw err;
  }
}

async function executeCancelInTx(
  tx: Transaction,
  input: {
    orderId: number;
    reason: string;
    actingCustomerId?: string | null;
  },
): Promise<ActionResult> {
  const rows = await sequelize.query<{
    id: number;
    status: OrderStatus;
    customer_id: string;
  }>(
    `
    SELECT id, status, customer_id
    FROM orders
    WHERE id = :orderId
    FOR UPDATE
    `,
    {
      replacements: { orderId: input.orderId },
      transaction: tx,
      type: QueryTypes.SELECT,
    },
  );

  if (!rows.length) {
    return {
      ok: false,
      code: GUARDRAIL_CODE.ORDER_NOT_FOUND,
      message: `Order ${input.orderId} not found.`,
    };
  }

  const row = rows[0];
  try {
    assertCancelAllowed({
      orderStatus: row.status,
      orderCustomerId: row.customer_id,
      actingCustomerId: input.actingCustomerId,
    });
  } catch (err) {
    if (err instanceof GuardrailError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }

  const order = await Order.findByPk(input.orderId, { transaction: tx });
  if (!order) {
    return {
      ok: false,
      code: GUARDRAIL_CODE.ORDER_NOT_FOUND,
      message: `Order ${input.orderId} not found.`,
    };
  }
  await order.update(
    { status: OrderStatus.CANCELLED },
    { transaction: tx },
  );

  return {
    ok: true,
    data: { ...order.toJSON(), cancelReason: input.reason },
  };
}
