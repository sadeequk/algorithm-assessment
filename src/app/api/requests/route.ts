import { SupportRequestStatus } from "@/constants";
import { runAgentLoop } from "@/lib/agent/loop";
import { serializeRequest } from "@/lib/serializers";
import { withApi, jsonOk, apiCreated, apiFail } from "@/middlewares";
import { Customer, SupportRequest } from "@/models";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const requests = await SupportRequest.findAll({
    order: [["created_at", "DESC"]],
    include: [
      { model: Customer, as: "customer", attributes: ["id", "email", "name"] },
      { association: "escalation" },
      {
        association: "agentRuns",
        separate: true,
        limit: 1,
        order: [["started_at", "DESC"]],
        include: [
          {
            association: "toolCalls",
            separate: true,
            order: [["sequence", "ASC"]],
          },
        ],
      },
    ],
  });

  return jsonOk({
    requests: requests.map((r) => serializeRequest(r as never)),
  });
});

export const POST = withApi(async (req) => {
  const body = await req.json().catch(() => null);
  const customerMessage =
    typeof body?.customerMessage === "string" ? body.customerMessage.trim() : "";
  const customerEmail =
    typeof body?.customerEmail === "string"
      ? body.customerEmail.trim().toLowerCase()
      : undefined;

  if (!customerMessage) {
    return apiFail("customerMessage is required");
  }

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
      { association: "escalation" },
      {
        association: "agentRuns",
        include: [
          {
            association: "toolCalls",
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
