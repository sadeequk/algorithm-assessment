import { serializeOrder, serializeRequest } from "@/lib/serializers";
import { withApi, apiFail, jsonOk } from "@/middlewares";
import { Customer, Order, SupportRequest } from "@/models";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const request = await SupportRequest.findByPk(id, {
    include: [
      { model: Customer, as: "customer" },
      { association: "escalation" },
      {
        association: "agentRuns",
        separate: true,
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

  if (!request) {
    return apiFail("Not found", 404);
  }

  let order = null;
  const esc = (
    request as SupportRequest & {
      escalation?: { proposed_payload?: { orderId?: number } };
    }
  ).escalation;

  if (esc?.proposed_payload?.orderId) {
    const found = await Order.findByPk(esc.proposed_payload.orderId, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "email", "name"],
        },
        { association: "refunds" },
      ],
    });
    order = found ? serializeOrder(found as never) : null;
  }

  return jsonOk({
    request: serializeRequest(request as never),
    order,
  });
});
