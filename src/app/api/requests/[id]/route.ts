import { serializeOrder, serializeRequest } from "@/lib/serializers";
import { withApi, apiFail, jsonOk } from "@/middlewares";
import {
  AgentRun,
  Customer,
  Escalation,
  Order,
  Refund,
  SupportRequest,
  ToolCall,
} from "@/models";
import { requestSchemas, validate } from "@/validation";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id } = validate(
    requestSchemas.request_get_params,
    await ctx.params,
  );
  const request = await SupportRequest.findByPk(id, {
    include: [
      { model: Customer, as: "customer" },
      { model: Escalation, as: "escalation" },
      {
        model: AgentRun,
        as: "agentRuns",
        separate: true,
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

  if (!request) {
    return apiFail("Not found", 404);
  }

  let order = null;
  const esc = (request as any).escalation;

  if (esc?.proposed_payload?.orderId) {
    const found = await Order.findByPk(esc.proposed_payload.orderId, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "email", "name"],
        },
        { model: Refund, as: "refunds" },
      ],
    });
    order = found ? serializeOrder(found as never) : null;
  }

  return jsonOk({
    request: serializeRequest(request as never),
    order,
  });
});
