import { executeRefund } from "@/lib/actions";
import { withApi, apiActionResult, apiCreated, jsonOk } from "@/middlewares";
import { Order, Refund } from "@/models";
import { refundSchemas, validateJson } from "@/validation";

export const dynamic = "force-dynamic";

export const POST = withApi(async (req) => {
  const { orderId, amountCents, reason } = await validateJson(
    refundSchemas.refund_post,
    req,
  );

  const result = await executeRefund({ orderId, amountCents, reason });
  if (!result.ok) {
    return apiActionResult(result);
  }
  return apiCreated(result);
});

export const GET = withApi(async () => {
  const refunds = await Refund.findAll({
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "total_cents", "status"],
      },
    ],
  });

  return jsonOk({
    refunds: refunds.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      amountCents: r.amount_cents,
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
      order: r.order
        ? {
            id: r.order.id,
            totalCents: r.order.total_cents,
            status: r.order.status,
          }
        : null,
    })),
  });
});
