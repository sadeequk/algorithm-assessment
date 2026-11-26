import { SupportRequestStatus } from "@/constants";
import { runAgentLoop } from "@/lib/agent/loop";
import { serializeRequest } from "@/lib/serializers";
import { withApi, jsonOk, apiCreated } from "@/middlewares";
import {
  AgentRun,
  Customer,
  Escalation,
  SupportRequest,
  ToolCall,
} from "@/models";
import { requestSchemas, validateJson } from "@/validation";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const requests = await SupportRequest.findAll({
    order: [["created_at", "DESC"]],
    include: [
      { model: Customer, as: "customer", attributes: ["id", "email", "name"] },
      { model: Escalation, as: "escalation" },
      {
        model: AgentRun,
        as: "agentRuns",
        separate: true,
        limit: 1,
        order: [["started_at", "DESC"]],
        include: [
          {
            model: ToolCall,
            as: "toolCalls",
            separate: true,
            order: [["sequence", "ASC"]],
          },
        ],
      },
    ],
  });

  return jsonOk({
    requests: requests.map((r: any) => serializeRequest(r)),
  });
});

export const POST = withApi(async (req) => {
  const { customerMessage, customerEmail } = await validateJson(
    requestSchemas.request_post,
    req,
  );

  let customerId: string | undefined;
  if (customerEmail) {
    const customer = await Customer.findOne({ where: { email: customerEmail } });
    customerId = customer?.id;
  }

  const request = await SupportRequest.create({
    customer_message: customerMessage,
    customer_id: customerId ?? null,
    status: SupportRequestStatus.RECEIVED,
  });

  try {
    await runAgentLoop(request.id);
  } catch (err) {
    console.error("Agent failed", err);
  }

  const full = await SupportRequest.findByPk(request.id, {
    include: [
      { model: Customer, as: "customer" },
      { model: Escalation, as: "escalation" },
      {
        model: AgentRun,
        as: "agentRuns",
        include: [
          {
            model: ToolCall,
            as: "toolCalls",
            separate: true,
            order: [["sequence", "ASC"]],
          },
        ],
      },
    ],
  });

  return apiCreated({
    request: full ? serializeRequest(full as never) : null,
  });
});
