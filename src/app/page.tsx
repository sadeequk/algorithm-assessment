import Link from "next/link";
import { SupportRequestStatus } from "@/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { ensureDb } from "@/lib/db";
import { formatWhen, humanizeAgentText } from "@/lib/format";
import { AgentRun, Customer, Escalation, SupportRequest } from "@/models";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  await ensureDb();
  const requests = await SupportRequest.findAll({
    order: [["created_at", "DESC"]],
    include: [
      { model: Customer, as: "customer", attributes: ["email", "name"] },
      { model: Escalation, as: "escalation" },
      {
        model: AgentRun,
        as: "agentRuns",
        separate: true,
        limit: 1,
        order: [["started_at", "DESC"]],
      },
    ],
  });

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Support queue</h1>
        <p className="muted">
          Review agent decisions quickly. Escalations need human approval before
          money moves.
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 style={{ margin: 0 }}>Requests · {requests.length}</h2>
          <Link className="button" href="/submit">
            New request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No requests yet.</p>
            <p>
              Start with <Link href="/submit">New request</Link> using a seeded
              order like 1043 or 1044.
            </p>
          </div>
        ) : (
          <div className="queue-list">
            {requests.map((r: any) => {
              const row = r;
              const run = row.agentRuns?.[0];
              const decisionLabel =
                row.status === SupportRequestStatus.ESCALATED
                  ? `Escalate · ${row.escalation?.proposed_action ?? "?"}`
                  : row.status === SupportRequestStatus.AUTO_RESOLVED
                    ? "Executed automatically"
                    : String(row.status).replaceAll("_", " ");

              const note =
                row.escalation?.escalation_reason ||
                row.outcome_summary ||
                humanizeAgentText(run?.reasoning_summary);

              return (
                <article className="queue-card" key={row.id}>
                  <div className="queue-card-main">
                    <div className="queue-card-top">
                      <StatusBadge status={row.status} />
                      <time className="queue-when">{formatWhen(row.created_at)}</time>
                    </div>

                    <p className="queue-message">{row.customer_message}</p>

                    {row.customer && (
                      <p className="queue-customer">
                        {row.customer.name}
                        <span>·</span>
                        {row.customer.email}
                      </p>
                    )}

                    <div className="queue-meta">
                      <div>
                        <div className="queue-meta-label">Decision</div>
                        <div className="queue-meta-value">{decisionLabel}</div>
                      </div>
                      <div>
                        <div className="queue-meta-label">
                          {row.escalation ? "Escalation reason" : "Notes"}
                        </div>
                        <div className="queue-meta-value muted-tight">
                          {note || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="queue-card-action">
                    {row.escalation ? (
                      <Link
                        className="button"
                        href={`/escalations/${row.escalation.id}`}
                      >
                        Review
                      </Link>
                    ) : (
                      <Link
                        className="button secondary"
                        href={`/requests/${row.id}`}
                      >
                        Details
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
