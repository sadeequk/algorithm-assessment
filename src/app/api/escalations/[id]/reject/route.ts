import { DEFAULT_REVIEWER } from "@/constants";
import { rejectEscalation } from "@/lib/actions";
import { withApi, apiActionResult } from "@/middlewares";

export const dynamic = "force-dynamic";

export const POST = withApi(async (req, ctx) => {
  const { id } = await (ctx.params as Promise<{ id: string }>);
  const body = await req.json().catch(() => ({}));
  const reviewer =
    typeof body?.reviewer === "string" && body.reviewer.trim()
      ? body.reviewer.trim()
      : DEFAULT_REVIEWER;

  const result = await rejectEscalation({ escalationId: id, reviewer });
  return apiActionResult(result);
});
