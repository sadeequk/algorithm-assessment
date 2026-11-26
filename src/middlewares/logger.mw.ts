export function logRequest(req: Request, extra?: Record<string, unknown>) {
  const url = new URL(req.url);
  const line = `${req.method} - ${url.pathname}${url.search}`;
  console.log(line);

  if (extra && Object.keys(extra).length > 0) {
    console.log("CONTEXT:", extra);
  }
}

export function logApiError(
  req: Request,
  err: unknown,
  kind: "CLIENT" | "SERVER" = "SERVER",
) {
  const url = new URL(req.url);
  const message = err instanceof Error ? err.message : String(err);
  console.log(`${kind}-ERROR: [${req.method}-${url.pathname}] ${message}`);
}
