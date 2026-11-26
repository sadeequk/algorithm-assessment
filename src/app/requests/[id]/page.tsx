import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ensureDb } from "@/lib/db";
import {
  formatWhen,
  humanizeAgentText,
  summarizeTool,
  toolDisplayName,
} from "@/lib/format";
import { Customer, SupportRequest } from "@/models";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureDb();
  const { id } = await params;
  const request = await SupportRequest.findByPk(id, {
    include: [
      { model: Customer, as: "customer" },
      { association: "escalation" },
      {
        association: "agentRuns",
        separate: true,
        order: [["started_at", "DESC"]],
        include: [
          {
            association: "toolCalls",
            separate: true,
            order: [["sequence", "ASC"]],
          },
        ],
      },
    ],
  });

  if (!request) notFound();

  const row = request as SupportRequest & {
    customer?: { name: string; email: string } | null;
    escalation?: { id: string } | null;
    agentRuns?: Array<{
      id: string;
      status: string;
      reasoning_summary: string | null;
      final_outcome: string | null;
      started_at?: Date;
      toolCalls?: Array<{
        id: string;
        sequence: number;
        tool_name: string;
        tool_arguments: unknown;
        result: unknown;
      }>;
    }>;
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Request detail</h1>
            <p className="muted">Trace of what the agent decided and why.</p>
          </div>
          <Link className="button secondary" href="/">
            Back to queue
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ marginBottom: 12 }}>
          <StatusBadge status={row.status} />
          {row.created_at && (
            <span className="muted" style={{ fontSize: 13 }}>
              {formatWhen(row.created_at)}
            </span>
          )}
          {row.escalation && (
            <Link className="link-action" href={`/escalations/${row.escalation.id}`}>
              Open escalation review
            </Link>
          )}
        </div>

        <p className="quote">{row.customer_message}</p>

        {row.customer && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            {row.customer.name} · {row.customer.email}
          </p>
        )}

        {row.outcome_summary && (
          <div className="outcome-box">
            <div className="queue-meta-label">Outcome</div>
            <div>{row.outcome_summary}</div>
          </div>
        )}
      </div>

      {(row.agentRuns || []).map((run) => {
        const summary = humanizeAgentText(run.reasoning_summary, 400);
        return (
          <div className="panel" key={run.id}>
            <div className="panel-head">
              <h2 style={{ margin: 0 }}>Agent run</h2>
              <StatusBadge status={run.status.toUpperCase()} />
            </div>

            {summary && <p className="run-summary">{summary}</p>}

            <div className="tool-steps">
              {(run.toolCalls || []).length === 0 ? (
                <p className="muted">No tool calls recorded.</p>
              ) : (
                (run.toolCalls || []).map((t) => (
                  <div className="tool-step" key={t.id}>
                    <div className="tool-step-head">
                      <span className="tool-step-num">{t.sequence}</span>
                      <span className="tool-step-name">
                        {toolDisplayName(t.tool_name)}
                      </span>
                    </div>
                    <div className="tool-step-body">
                      {summarizeTool(t.tool_name, t.tool_arguments, t.result)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
