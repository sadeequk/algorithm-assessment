# Algorithm Assessment — Architecture

Support Operations Console for the Algorithm Full Stack Engineer (AI-First) assessment.

## Agent boundary

The human reviewer is the center of the product. An incorrect refund or cancellation is treated as worse than over-escalation.

### Autonomous (agent may execute)

| Action | Condition |
|--------|-----------|
| `get_order` / `find_orders_by_email` | Always (read-only) |
| `cancel_order` | Only when order status is `PENDING` or `PROCESSING` |
| `resolve_without_action` | Informational close (unknown order, no mutation) |

### Requires human approval

| Action | Why |
|--------|-----|
| All refunds | Money movement — always escalated |
| Replacements | Treated as financial/policy decisions |
| Cancel after ship/delivery | Not auto-eligible; escalate |

There is **no refund tool** exposed to the LLM. Refunds can only happen via `escalate_for_approval` → human Approve → `executeRefund` in application code.

### Enforcement in code (not prompts)

1. **Tool surface** — `src/lib/agent/tools.ts` simply does not offer a refund executor to the model.
2. **Eligibility gate** — `cancel_order` refuses when `!isAutoCancelEligible(status)` (`src/lib/guardrails.ts`).
3. **Hard guardrails** — `assertRefundAllowed` / `assertCancelAllowed` run inside DB transactions in `src/lib/actions.ts` regardless of what the LLM or a reviewer requested.
4. **Approval claim** — `UPDATE Escalation SET status='APPROVED' WHERE status='PENDING'` so only one reviewer wins.

Prompts guide behavior; **invariants live in TypeScript + PostgreSQL**.

## Tool design

Tools are OpenAI function definitions (`toolDefinitions`) executed by `executeTool`. The agent loop (`src/lib/agent/loop.ts`) repeatedly calls the model with tools until the request is escalated, auto-resolved, or the step limit is hit.

Design choices:

- **Narrow, intention-revealing tools** instead of a generic SQL tool — reduces blast radius and makes traces readable.
- **Escalate carries the full proposed payload** (action, orderId, amountCents, reasoning) so the UI and approve path do not re-interpret free text.
- **Read tools return structured facts** (`autoCancelEligible`, `refunded`, totals) so the model decides from data, not memory.

Data is exposed as JSON results from Sequelize queries. The agent never receives raw DB credentials or unbounded query power.

## Failure handling

| Failure | Behavior |
|---------|----------|
| Hallucinated order ID | `get_order` returns `found:false`; agent should `resolve_without_action`. Escalation create also fails if order missing. |
| Refund amount &gt; payment | `assertRefundAllowed` throws `AMOUNT_EXCEEDS_PAYMENT` before insert. |
| Already refunded | Pre-check + unique `order_id` on `refunds`; concurrent second insert → unique violation → safe failure. |
| Someone else’s order | Optional `actingCustomerId` compared to `order.customer_id` → `WRONG_CUSTOMER`. |
| Cancel after shipped | `assertCancelAllowed` → `ALREADY_SHIPPED`. |
| Double approve | Conditional update on `PENDING`; loser gets HTTP 409 + UI refresh. |

## Concurrency

**Refunds:** Sequelize `lock: UPDATE` on the order row, then insert into `Refund` with unique `order_id`. Two simultaneous refunds → one row, one error.

**Approvals:** Single SQL `UPDATE … WHERE status = 'PENDING' RETURNING …`. First reviewer claims; second sees `ALREADY_RESOLVED`.

## Traceability

Persisted for every request:

- `SupportRequest` — customer message, status, outcome summary
- `AgentRun` — status, reasoning summary, final outcome
- `ToolCall` — sequence, tool name, arguments, result JSON
- `Escalation` — proposed action/payload, reasoning, resolution metadata
- `Refund` — amount, reason, link to request when applicable

## Build vs buy (production)

| Concern | This assessment | Production preference |
|---------|-----------------|----------------------|
| Agent runtime | Hand-rolled OpenAI tool loop | Vercel AI SDK / LangGraph / Temporal+tools for retries & timeouts |
| Job queue | Inline request → agent | Queue (BullMQ, SQS, Vercel Queues) so HTTP isn’t blocked on LLM latency |
| Database | Postgres + Sequelize | Same; add read replicas, connection pooling (PgBouncer) |
| Observability | DB traces + console | OpenTelemetry, Langfuse/Braintrust for LLM traces, Sentry |
| Auth | None (reviewer name field) | SSO / RBAC for reviewers |
| Idempotency | Unique refund + escalation claim | Explicit idempotency keys on all money APIs |
| Feature flags | Env `USE_MOCK_AGENT` | LaunchDarkly / Flags SDK for rollout of auto-actions |

Built here: the smallest honest slice that proves guardrails, concurrency, and a human review UX. Would adopt battle-tested queues, auth, and LLM observability before scaling.

## Design decisions

### 1. Always escalate refunds (no autonomous refund tool)

**Alternatives:** Auto-refund below a dollar threshold; confidence-based auto-approve.

**Rejected because:** The brief’s core principle says incorrect refunds are costly. A threshold still needs the same DB guardrails and creates a second path reviewers must reason about. Escalation-only refunds make the approval boundary a **system property**.

### 2. Next.js full-stack monolith for the assessment

**Alternatives:** Separate Express API + Vite SPA; serverless functions only.

**Rejected (for this scope):** One TypeScript deployable keeps setup and the live URL simple. Domain logic still lives in `src/lib/*` so it can be extracted later. Production might split worker vs web.

### 3. Database constraints + row locks over in-memory locks

**Alternatives:** Redis locks; “check-then-act” without unique indexes; application mutex.

**Rejected because:** Reviewers explicitly test concurrent HTTP requests against the refunds table. Only a uniqueness constraint plus transactions survive multi-instance deploys without timing assumptions.
