import {
  AUTO_CANCEL_ELIGIBLE_STATUSES,
  GUARDRAIL_CODE,
  OrderStatus,
} from "@/constants";

export class GuardrailError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GuardrailError";
    this.code = code;
  }
}

export function assertRefundAllowed(input: {
  orderStatus: OrderStatus;
  orderTotalCents: number;
  amountCents: number;
  existingRefund: boolean;
  orderCustomerId: string;
  actingCustomerId?: string | null;
}) {
  if (input.existingRefund) {
    throw new GuardrailError(
      GUARDRAIL_CODE.ALREADY_REFUNDED,
      "Order already has a completed refund.",
    );
  }

  if (input.orderStatus === OrderStatus.CANCELLED) {
    throw new GuardrailError(
      GUARDRAIL_CODE.ORDER_CANCELLED,
      "Cannot refund a cancelled order.",
    );
  }

  if (input.amountCents <= 0) {
    throw new GuardrailError(
      GUARDRAIL_CODE.INVALID_AMOUNT,
      "Refund amount must be greater than zero.",
    );
  }

  if (input.amountCents > input.orderTotalCents) {
    throw new GuardrailError(
      GUARDRAIL_CODE.AMOUNT_EXCEEDS_PAYMENT,
      `Refund of ${input.amountCents} cents exceeds order total of ${input.orderTotalCents} cents.`,
    );
  }

  if (
    input.actingCustomerId &&
    input.actingCustomerId !== input.orderCustomerId
  ) {
    throw new GuardrailError(
      GUARDRAIL_CODE.WRONG_CUSTOMER,
      "Cannot refund an order that belongs to a different customer.",
    );
  }
}

export function assertCancelAllowed(input: {
  orderStatus: OrderStatus;
  orderCustomerId: string;
  actingCustomerId?: string | null;
}) {
  if (input.orderStatus === OrderStatus.CANCELLED) {
    throw new GuardrailError(
      GUARDRAIL_CODE.ALREADY_CANCELLED,
      "Order is already cancelled.",
    );
  }

  if (
    input.orderStatus === OrderStatus.SHIPPED ||
    input.orderStatus === OrderStatus.DELIVERED
  ) {
    throw new GuardrailError(
      GUARDRAIL_CODE.ALREADY_SHIPPED,
      "Cannot cancel an order that has already shipped.",
    );
  }

  if (
    input.actingCustomerId &&
    input.actingCustomerId !== input.orderCustomerId
  ) {
    throw new GuardrailError(
      GUARDRAIL_CODE.WRONG_CUSTOMER,
      "Cannot cancel an order that belongs to a different customer.",
    );
  }
}

export function isAutoCancelEligible(status: OrderStatus): boolean {
  return AUTO_CANCEL_ELIGIBLE_STATUSES.includes(status);
}
