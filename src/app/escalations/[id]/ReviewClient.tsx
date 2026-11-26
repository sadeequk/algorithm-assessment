"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { EscalationStatus } from "@/constants";
import {
  formatCents,
  humanizeAgentText,
  summarizeTool,
  toolDisplayName,
} from "@/lib/format";

type OrderItem = { sku?: string; name?: string; qty?: number; cents?: number };

type EscalationPayload = {
  escalation: {
    id: string;
    status: string;
    proposedAction: string;
    proposedPayload: {
      orderId: number;
      amountCents?: number;
      reason?: string;
    };
    agentReasoning: string;
    escalationReason: string;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    version: number;
    supportRequest: {
      id: string;
      customerMessage: string;
      status: string;
      customer?: { name: string; email: string } | null;
      agentRuns: Array<{
        reasoningSummary?: string | null;
        finalOutcome?: string | null;
        toolCalls: Array<{
          sequence: number;
          toolName: string;
          arguments: unknown;
          result: unknown;
        }>;
      }>;
    };
  };
  order: {
    id: number;
    status: string;
    totalCents: number;
    currency: string;
    itemsJson: unknown;
    shippedAt?: string | null;
    customer: { name: string; email: string };
    refunds: Array<{ id: string; amountCents: number; status: string }>;
  } | null;
};

function asItems(value: unknown): OrderItem[] {
  return Array.isArray(value) ? (value as OrderItem[]) : [];
}

export function ReviewClient({ escalationId }: { escalationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<EscalationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [reviewer, setReviewer] = useState("Reviewer A");

  const load = useCallback(async () => {
    const res = await fetch(`/api/escalations/${escalationId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Escalation not found");
      return;
    }
    const json = (await res.json()) as EscalationPayload;
    setData(json);
  }, [escalationId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      void load();
    }, 2500);
    return () => clearInterval(t);
  }, [load]);

  async function act(kind: "approve" | "reject") {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/escalations/${escalationId}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer }),
      });
      const json = await res.json();
      await load();
      router.refresh();

      if (!res.ok) {
        setBanner({
          kind: res.status === 409 ? "warn" : "error",
          text: json.message || json.code || "Action failed",
        });
        return;
      }
      setBanner({
        kind: "ok",
        text: kind === "approve" ? "Approved — action executed once." : "Rejected.",
      });
    } catch (err) {
      setBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="stack">
        <div className="page-header">
          <h1>Escalation review</h1>
        </div>
        <div className="banner error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stack">
        <div className="page-header">
          <h1>Escalation review</h1>
          <p className="muted">Loading escalation…</p>
        </div>
        <div className="panel skeleton-panel">Preparing reviewer view…</div>
      </div>
    );
  }

  const { escalation, order } = data;
  const pending = escalation.status === EscalationStatus.PENDING;
  const run = escalation.supportRequest.agentRuns[0];
  const payload = escalation.proposedPayload;
  const items = order ? asItems(order.itemsJson) : [];
  const runNote = humanizeAgentText(run?.reasoningSummary, 280);

  return (
    <div className="stack">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Escalation review</h1>
            <p className="muted">
              Decide safely. Approval runs the guarded action exactly once.
            </p>
          </div>
          <Link className="button secondary" href="/">
            Back to queue
          </Link>
        </div>
      </div>

      {banner && (
        <div
          className={`banner ${
            banner.kind === "error" ? "error" : banner.kind === "warn" ? "warn" : ""
          }`}
        >
          {banner.text}
        </div>
      )}

      {!pending && (
        <div className="banner warn">
          Already {escalation.status.toLowerCase()}
          {escalation.resolvedBy ? ` by ${escalation.resolvedBy}` : ""}.
          {escalation.resolvedAt
            ? ` (${new Date(escalation.resolvedAt).toLocaleString()})`
            : ""}
        </div>
      )}

      <div className="grid-2">
        <div className="stack">
          <div className="panel">
            <h2>Customer request</h2>
            <p className="quote">{escalation.supportRequest.customerMessage}</p>
            {escalation.supportRequest.customer && (
              <p className="muted" style={{ marginTop: 10 }}>
                {escalation.supportRequest.customer.name} ·{" "}
                {escalation.supportRequest.customer.email}
              </p>
            )}
            <div className="row" style={{ marginTop: 10 }}>
              <StatusBadge status={escalation.supportRequest.status} />
              <StatusBadge status={escalation.status} />
            </div>
          </div>

          <div className="panel">
            <h2>Why the agent escalated</h2>
            <p className="reason-lead">{escalation.escalationReason}</p>
            <div className="divider" />
            <p className="queue-meta-label">Agent reasoning</p>
            <p className="reason-body">{escalation.agentReasoning}</p>
            {runNote && (
              <>
                <div className="divider" />
                <p className="queue-meta-label">Run summary</p>
                <p className="reason-body">{runNote}</p>
              </>
            )}
          </div>

          <div className="panel">
            <h2>What the agent did</h2>
            {!run?.toolCalls?.length ? (
              <p className="muted">No tool calls recorded.</p>
            ) : (
              <div className="tool-steps">
                {run.toolCalls.map((t) => (
                  <div className="tool-step" key={t.sequence}>
                    <div className="tool-step-head">
                      <span className="tool-step-num">{t.sequence}</span>
                      <span className="tool-step-name">
                        {toolDisplayName(t.toolName)}
                      </span>
                    </div>
                    <div className="tool-step-body">
                      {summarizeTool(t.toolName, t.arguments, t.result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack sticky-aside">
          <div className="panel">
            <h2>Proposed action</h2>
            <div className="action-hero">
              <strong>{escalation.proposedAction}</strong>
              <span className="muted">Order #{payload.orderId}</span>
              {payload.amountCents != null && (
                <div className="action-amount">{formatCents(payload.amountCents)}</div>
              )}
            </div>
            {payload.reason && (
              <p className="muted" style={{ marginTop: 0 }}>
                {payload.reason}
              </p>
            )}

            <label style={{ marginTop: 4 }}>
              Reviewer name
              <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
            </label>

            <div className="row" style={{ marginTop: 12 }}>
              <button disabled={!pending || busy} onClick={() => void act("approve")}>
                {busy ? "Working…" : "Approve"}
              </button>
              <button
                className="danger"
                disabled={!pending || busy}
                onClick={() => void act("reject")}
              >
                Reject
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Order</h2>
            {!order ? (
              <p className="muted">Order not found.</p>
            ) : (
              <div className="stack">
                <div className="row">
                  <span style={{ fontWeight: 650 }}>#{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>

                <dl className="kv">
                  <div className="kv-row">
                    <dt>Total</dt>
                    <dd>{formatCents(order.totalCents, order.currency)}</dd>
                  </div>
                  <div className="kv-row">
                    <dt>Customer</dt>
                    <dd>
                      {order.customer.name}
                      <div className="item-meta">{order.customer.email}</div>
                    </dd>
                  </div>
                  {order.shippedAt && (
                    <div className="kv-row">
                      <dt>Shipped</dt>
                      <dd>{new Date(order.shippedAt).toLocaleString()}</dd>
                    </div>
                  )}
                  <div className="kv-row">
                    <dt>Refunds</dt>
                    <dd>
                      {order.refunds.length === 0
                        ? "None yet"
                        : order.refunds
                            .map((r) => `${formatCents(r.amountCents)} · ${r.status}`)
                            .join(", ")}
                    </dd>
                  </div>
                </dl>

                <div>
                  <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
                    Line items
                  </p>
                  <ul className="item-list">
                    {items.map((item, idx) => (
                      <li key={`${item.sku || "item"}-${idx}`}>
                        <div>
                          <div>{item.name || item.sku || "Item"}</div>
                          <div className="item-meta">
                            {item.sku ? `${item.sku} · ` : ""}
                            qty {item.qty ?? 1}
                          </div>
                        </div>
                        <div style={{ fontWeight: 650 }}>
                          {formatCents(item.cents ?? 0)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
