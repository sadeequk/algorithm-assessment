# Algorithm Assessment — Support Operations Console

Full Stack Engineer (AI-First) assessment for **Algorithm**.

Full-stack Support Operations Console for an e-commerce store: a real tool-calling AI agent plus a human review dashboard.

- Organization: **Algorithm**
- Language: TypeScript (Next.js App Router)
- Database: PostgreSQL (**Sequelize**)
- AI: OpenAI tool-calling loop (mock agent fallback without an API key)

## Features verified by design

- **Agent loop** — LLM chooses tools; sequence is not hardcoded (see `src/lib/agent/loop.ts`)
- **Guardrails in code** — `src/lib/guardrails.ts` + `src/lib/actions.ts`
- **Double-refund protection** — unique `order_id` on `refunds` + `SELECT FOR UPDATE`
- **Double-approve protection** — conditional `UPDATE … WHERE status = 'PENDING'`
- **Traceability** — requests, agent runs, tool calls, escalations, refunds in Postgres

## Quick start (local)

### Prerequisites

- Node.js 20+
- Hosted Postgres URL (Supabase / Neon)

### 1. Install

```bash
cd algorithm-assessment
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
USE_MOCK_AGENT="false"
```

### 3. Database

```bash
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Path | Purpose |
|------|---------|
| `/` | Support queue — decisions, escalation reasons |
| `/submit` | Submit a customer message to the agent |
| `/escalations/[id]` | Human review — approve / reject |
| `/requests/[id]` | Full trace (tool calls, outcomes) |

## Seeded data

| Order | Customer | Status | Total | Notes |
|-------|----------|--------|-------|-------|
| 1043 | alice@example.com | DELIVERED | $129.99 | refund / replace |
| 1044 | alice@example.com | PROCESSING | $45.99 | auto-cancel OK |
| 1045 | alice@example.com | PENDING | $79.99 | auto-cancel OK |
| 2001 | bob@example.com | SHIPPED | $89.99 | cancel → escalate |
| 2002 | bob@example.com | PENDING | $24.99 | auto-cancel OK |
| 2003 | bob@example.com | DELIVERED | $54.99 | refund |
| 3001 | cara@example.com | DELIVERED | $199.99 | damaged / replace |
| 3002 | cara@example.com | CANCELLED | $15.00 | already cancelled |
| 3003 | cara@example.com | SHIPPED | $64.99 | cancel → escalate |
| 4001 | diego@example.com | PROCESSING | $159.99 | auto-cancel OK |
| 4002 | diego@example.com | DELIVERED | $29.99 | refund |
| 5001 | emma@example.com | PENDING | $99.99 | auto-cancel OK |
| 5002 | emma@example.com | DELIVERED | $44.99 | refund |

## Guardrail reference (debrief)

| Rule | Code |
|------|------|
| Refund > payment | `assertRefundAllowed` in `src/lib/guardrails.ts` |
| Already refunded | same + unique `order_id` in `src/models/refund.model.ts` |
| Cancel after shipped | `assertCancelAllowed` in `src/lib/guardrails.ts` |
| Execute refund/cancel | `src/lib/actions.ts` |
| Approve once | `approveEscalation` conditional update |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production |
| `npm run db:seed` | Sync Sequelize models + seed data |
| `npm run test:concurrency` | Parallel refund smoke test |

## Deploy (Vercel + hosted Postgres)

1. Create a Neon/Supabase Postgres database.
2. Set `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` in the host.
3. Run `npm run db:seed` against production URL once.
4. Deploy the Next.js app (Vercel recommended).

See `ARCHITECTURE.md` for boundary, tools, failure modes, and build-vs-buy notes.
# algorithm-assessment
