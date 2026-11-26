import { serializeOrder } from "@/lib/serializers";
import { withApi, apiFail, jsonOk } from "@/middlewares";
import { Customer, Order, Refund } from "@/models";
import { orderSchemas, validate } from "@/validation";

export const dynamic = "force-dynamic";

export const GET = withApi(async (_req, ctx) => {
  const { id: orderId } = validate(
    orderSchemas.order_get_params,
    await ctx.params,
  );

  const order = await Order.findByPk(orderId, {
    include: [
      { model: Customer, as: "customer" },
      { model: Refund, as: "refunds" },
    ],
  });

  if (!order) {
    return apiFail("Not found", 404);
  }

  return jsonOk({ order: serializeOrder(order as never) });
});
