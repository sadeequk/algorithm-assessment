export function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function formatWhen(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function humanizeAgentText(text: string | null | undefined, max = 140) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    /^(escalate_for_approval|cancel_order|get_order|resolve_without_action|find_orders_by_email)\s*:/.test(
      trimmed,
    )
  ) {
    return null;
  }

  const clean = trimmed.replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function summarizeTool(
  toolName: string,
  args: unknown,
  result: unknown,
): string {
  const a = (args || {}) as Record<string, unknown>;
  const r = (result || {}) as Record<string, unknown>;

  if (toolName === "get_order") {
    if (r.found === false) return `Order ${a.orderId} not found`;
    const order = r.order as { status?: string; totalCents?: number } | undefined;
    return order
      ? `Found order #${a.orderId} · ${order.status} · ${formatCents(order.totalCents || 0)}`
      : `Looked up order #${a.orderId}`;
  }

  if (toolName === "escalate_for_approval") {
    return r.ok
      ? `Escalated ${a.proposedAction} for order #${a.orderId}`
      : `Escalation failed: ${String(r.message || r.code || "unknown")}`;
  }

  if (toolName === "cancel_order") {
    return (r as { ok?: boolean }).ok
      ? `Cancelled order #${a.orderId}`
      : `Cancel blocked: ${String((r as { message?: string }).message || "not eligible")}`;
  }

  if (toolName === "resolve_without_action") {
    return String(
      a.summary || (r as { summary?: string }).summary || "Resolved without mutation",
    );
  }

  if (toolName === "find_orders_by_email") {
    return r.found
      ? `Found customer orders for ${a.email}`
      : `No customer for ${a.email}`;
  }

  return toolName.replaceAll("_", " ");
}

export function toolDisplayName(toolName: string) {
  return toolName.replaceAll("_", " ");
}
