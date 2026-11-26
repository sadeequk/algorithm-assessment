import type { AgentRun } from "@/models/agent-run.model";
import type { Escalation } from "@/models/escalation.model";
import type { Order } from "@/models/order.model";
import type { SupportRequest } from "@/models/support-request.model";
import type { ToolCall } from "@/models/tool-call.model";
import type { Customer } from "@/models/customer.model";
import type { Refund } from "@/models/refund.model";

type RequestWithRelations = SupportRequest & {
  customer?: Customer | null;
  escalation?: Escalation | null;
  agentRuns?: Array<AgentRun & { toolCalls?: ToolCall[] }>;
};

export function serializeToolCall(t: ToolCall) {
  return {
    id: t.id,
    sequence: t.sequence,
    toolName: t.tool_name,
    arguments: t.tool_arguments,
    result: t.result,
    createdAt: t.created_at,
  };
}

export function serializeAgentRun(run: AgentRun & { toolCalls?: ToolCall[] }) {
  return {
    id: run.id,
    supportRequestId: run.support_request_id,
    status: run.status,
    finalOutcome: run.final_outcome,
    reasoningSummary: run.reasoning_summary,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    toolCalls: (run.toolCalls || []).map(serializeToolCall),
  };
}

export function serializeRequest(r: RequestWithRelations) {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerMessage: r.customer_message,
    status: r.status,
    outcomeSummary: r.outcome_summary,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: r.customer
      ? { id: r.customer.id, email: r.customer.email, name: r.customer.name }
      : null,
    escalation: r.escalation
      ? {
          id: r.escalation.id,
          supportRequestId: r.escalation.support_request_id,
          proposedAction: r.escalation.proposed_action,
          proposedPayload: r.escalation.proposed_payload,
          agentReasoning: r.escalation.agent_reasoning,
          escalationReason: r.escalation.escalation_reason,
          status: r.escalation.status,
          resolvedBy: r.escalation.resolved_by,
          resolvedAt: r.escalation.resolved_at,
          version: r.escalation.version,
          createdAt: r.escalation.created_at,
          updatedAt: r.escalation.updated_at,
        }
      : null,
    agentRuns: (r.agentRuns || []).map(serializeAgentRun),
  };
}

export function serializeEscalation(
  e: Escalation & {
    supportRequest?: RequestWithRelations;
  },
) {
  return {
    id: e.id,
    supportRequestId: e.support_request_id,
    proposedAction: e.proposed_action,
    proposedPayload: e.proposed_payload,
    agentReasoning: e.agent_reasoning,
    escalationReason: e.escalation_reason,
    status: e.status,
    resolvedBy: e.resolved_by,
    resolvedAt: e.resolved_at,
    version: e.version,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    supportRequest: e.supportRequest
      ? serializeRequest(e.supportRequest)
      : undefined,
  };
}

export function serializeOrder(
  o: Order & { customer?: Customer; refunds?: Refund[] },
) {
  return {
    id: o.id,
    customerId: o.customer_id,
    status: o.status,
    totalCents: o.total_cents,
    currency: o.currency,
    itemsJson: o.items_json,
    shippedAt: o.shipped_at,
    createdAt: o.created_at,
    customer: o.customer
      ? { id: o.customer.id, email: o.customer.email, name: o.customer.name }
      : undefined,
    refunds: (o.refunds || []).map((r) => ({
      id: r.id,
      orderId: r.order_id,
      amountCents: r.amount_cents,
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
    })),
  };
}
