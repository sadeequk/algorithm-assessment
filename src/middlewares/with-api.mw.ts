import { ZodError } from "zod";
import { ensureDb } from "@/lib/db";
import { GuardrailError } from "@/lib/guardrails";
import { CONFLICT_CODES } from "@/constants";
import { apiError, apiFail } from "./response.mw";
import { logApiError, logRequest } from "./logger.mw";

type RouteCtx = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: Request,
  ctx: RouteCtx,
) => Promise<Response> | Response;

function zodMessage(err: ZodError) {
  return err.issues.map((i) => i.message).join(", ");
}

export function withApi(handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    logRequest(req);

    try {
      await ensureDb();
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        const message = zodMessage(err);
        logApiError(req, new Error(message), "CLIENT");
        return apiFail(message);
      }

      if (err instanceof GuardrailError) {
        logApiError(req, err, "CLIENT");
        const status = CONFLICT_CODES.has(err.code) ? 409 : 400;
        return apiFail(err.message, status);
      }

      logApiError(req, err, "SERVER");
      return apiError();
    }
  };
}
