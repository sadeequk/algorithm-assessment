import { executeRefund } from "@/lib/actions";
import { withApi, apiFail, apiActionResult, apiCreated, jsonOk } from "@/middlewares";
import { Order, Refund } from "@/models";

export const dynamic = "force-dynamic";

export const POST = withApi(async (req) => {
  const body = await req.json().catch(() => null);
  const orderId = Number(body?.orderId);
  const amountCents = Number(body?.amountCents);
  const reason =
    typeof body?.reason === "string" ? body.reason : "Direct refund API";

  if (!Number.isFinite(orderId) || !Number.isFinite(amountCents)) {
    return apiFail("orderId and amountCents are required");
  }

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
    refunds: refunds.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      amountCents: r.amount_cents,
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
      order: (r as Refund & { order?: Order }).order
        ? {
            id: (r as Refund & { order: Order }).order.id,
            totalCents: (r as Refund & { order: Order }).order.total_cents,
            status: (r as Refund & { order: Order }).order.status,
          }
        : null,
    })),
  });
});
