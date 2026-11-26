import { serializeEscalation, serializeOrder } from "@/lib/serializers";
import { withApi, apiFail, jsonOk } from "@/middlewares";
import { Customer, Escalation, Order, SupportRequest } from "@/models";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const escalation = await Escalation.findByPk(id, {
    include: [
      {
        model: SupportRequest,
        as: "supportRequest",
        include: [
          { model: Customer, as: "customer" },
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
          { association: "refunds" },
        ],
      })
    : null;

  return jsonOk({
    escalation: serializeEscalation(escalation as never),
    order: found ? serializeOrder(found as never) : null,
  });
});
