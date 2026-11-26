import { rejectEscalation } from "@/lib/actions";
import { withApi, apiActionResult } from "@/middlewares";
import { escalationSchemas, validate, validateJson } from "@/validation";

export const dynamic = "force-dynamic";

export const POST = withApi(async (req, ctx) => {
  const { id } = validate(
    escalationSchemas.escalation_params,
    await ctx.params,
  );
  const { reviewer } = await validateJson(
    escalationSchemas.escalation_reject_post,
    req,
  );

  const result = await rejectEscalation({ escalationId: id, reviewer });
  return apiActionResult(result);
});
