import { serializeOrder } from "@/lib/serializers";
import { withApi, apiFail, jsonOk } from "@/middlewares";
import { Customer, Order } from "@/models";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return apiFail("Invalid order id");
  }

  const order = await Order.findByPk(orderId, {
    include: [
      { model: Customer, as: "customer" },
      { association: "refunds" },
    ],
  });

  if (!order) {
    return apiFail("Not found", 404);
  }

  return jsonOk({ order: serializeOrder(order as never) });
});
