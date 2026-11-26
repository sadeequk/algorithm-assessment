import { serializeEscalation, serializeOrder } from "@/lib/serializers";
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
import { escalationSchemas, validate } from "@/validation";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id } = validate(
    escalationSchemas.escalation_params,
    await ctx.params,
  );
  const escalation = await Escalation.findByPk(id, {
    include: [
      {
        model: SupportRequest,
        as: "supportRequest",
        include: [
          { model: Customer, as: "customer" },
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
      },
    ],
  });

  if (!escalation) {
    return apiFail("Not found", 404);
  }

  const payload = escalation.proposed_payload;
  const found = payload.orderId
    ? await Order.findByPk(payload.orderId, {
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "email", "name"],
          },
          { model: Refund, as: "refunds" },
        ],
      })
    : null;

  return jsonOk({
    escalation: serializeEscalation(escalation as never),
    order: found ? serializeOrder(found as never) : null,
  });
});
