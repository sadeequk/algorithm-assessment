export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS = OrderStatus;

export const AUTO_CANCEL_ELIGIBLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
];

export const RefundStatus = {
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];
export const REFUND_STATUS = RefundStatus;

export const SupportRequestStatus = {
  RECEIVED: "RECEIVED",
  PROCESSING: "PROCESSING",
  AUTO_RESOLVED: "AUTO_RESOLVED",
  ESCALATED: "ESCALATED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
export type SupportRequestStatus =
  (typeof SupportRequestStatus)[keyof typeof SupportRequestStatus];
export const SUPPORT_REQUEST_STATUS = SupportRequestStatus;

export const EscalationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type EscalationStatus =
  (typeof EscalationStatus)[keyof typeof EscalationStatus];
export const ESCALATION_STATUS = EscalationStatus;

export const ProposedActionType = {
  REFUND: "REFUND",
  CANCEL: "CANCEL",
  REPLACE: "REPLACE",
} as const;
export type ProposedActionType =
  (typeof ProposedActionType)[keyof typeof ProposedActionType];
export const PROPOSED_ACTION = ProposedActionType;

export const AgentRunStatus = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export type AgentRunStatus =
  (typeof AgentRunStatus)[keyof typeof AgentRunStatus];
export const AGENT_RUN_STATUS = AgentRunStatus;
