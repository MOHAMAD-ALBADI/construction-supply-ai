# Document 2 — Complete System Architecture

> Depends on: Doc 1 (product). Detailed by: Doc 3 (agents), Doc 5 (data).
> Rule: version-specific APIs (Next.js, Supabase SSR, OpenAI SDK, Zod, shadcn) **must be verified against official docs in Stage 1** before use. This document fixes the *shape* of the system; exact syntax is confirmed at implementation time.

---

## 1. Architectural principles

| # | Principle | Consequence |
|---|---|---|
| P1 | **One deployable** | A single Next.js (App Router, TypeScript) app on Vercel. No microservices, queues or separate agent servers. |
| P2 | **Agents propose, controller disposes** | The six agents return structured proposals. Only the deterministic **workflow controller** persists them as drafts and moves state. |
| P3 | **LLM numbers are never authoritative** | Every quantity, price, cost and total in an agent proposal is recomputed or verified by pure domain functions before it is stored. |
| P4 | **Humans authorise commerce** | Every commercial commitment passes a recorded human gate (§5.3). |
| P5 | **Tenant isolation in the database** | Supabase RLS is enabled on every table. Agents read data through the *triggering user's* RLS-scoped client. |
| P6 | **Zod at every boundary** | API input, agent input/output, tool arguments/results, env vars and JSON columns are all validated by Zod. |
| P7 | **Secrets server-side only** | OpenAI and Supabase secret keys are imported only from `server-only` modules. |
| P8 | **Honest simulation** | Simulated actions (dispatch, payment, factory systems) are explicit, labelled and audited as simulated. |
| P9 | **Live AI, no fake fallbacks** | The running app never substitutes canned agent output. If OpenAI fails, the run is recorded as failed and the UI says so. Test doubles exist **only** in automated tests. |

---

## 2. High-level component view

```
┌────────────────────────────── Browser (Arabic, RTL) ──────────────────────────────┐
│ Next.js React UI · shadcn/ui · Tailwind · persona dashboards · agent monitor     │
└───────────────▲─────────────────────────────────────────────┬────────────────────┘
                │ RSC payload / JSON                           │ fetch (JSON, Zod-validated)
┌───────────────┴──────────────── Next.js on Vercel (Node runtime) ─────────────────┐
│  app/(app)/**  Server Components ──read──► services (RLS client)                  │
│  app/api/**    Route Handlers ─────────► auth guard ─► services / workflow        │
│                                                                                    │
│  src/server/workflow   Deterministic Workflow Controller (NOT an agent)            │
│        │  state machines · gates · validation · persistence · audit                │
│        ▼                                                                           │
│  src/server/agents     Agent Runtime ─► 6 agent definitions ─► Tool Registry       │
│        │                     │                                   │                 │
│        │                     ▼                                   ▼                 │
│        │              OpenAI Responses API            read tools (RLS client)      │
│        │              (function calling,              compute tools (src/domain)   │
│        │               structured output)                                          │
│  src/domain            Pure deterministic logic (pricing, compatibility, ...)      │
│  src/server/db         Repositories · Supabase clients (user / admin)              │
└───────────────┬────────────────────────────────────────────────────────────────────┘
                │ PostgREST / Auth (HTTPS)
┌───────────────▼──────────── Supabase ─────────────────────────────────────────────┐
│ Postgres (RLS on all tables) · Auth (email/password) · optional Realtime           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend

| Concern | Decision |
|---|---|
| Framework | Next.js App Router, React Server Components by default; Client Components only for interactivity (forms, tables with client state, polling). |
| Language / direction | `<html lang="ar" dir="rtl">`. Radix `DirectionProvider dir="rtl"` wraps the app so shadcn/Radix primitives behave correctly. |
| Styling | Tailwind CSS with **logical utilities only** (`ms-/me-/ps-/pe-/start-/end-/text-start`), never `left/right/ml/mr`. Direction-sensitive icons get `rtl:-scale-x-100` (or `rotate-180`). |
| Components | shadcn/ui primitives in `src/components/ui`; feature components in `src/components/<area>`. |
| Font | An Arabic-first sans font via `next/font` (candidate: IBM Plex Sans Arabic; confirm in Stage 1). |
| i18n | Lightweight typed dictionary `src/i18n/ar.ts` (with `en.ts` stub). No hard-coded UI strings in components. |
| Number/date formatting | `Intl` with locale `ar-OM`, Latin digits (`nu-latn`) for business tables, Gregorian calendar, display time zone `Asia/Muscat`. Currency OMR shown with 3 decimals. |
| Branding | All names, logos and colours come from `src/config/brand.ts` (env-overridable). The codename never appears in components. |
| Data fetching | Server Components call services directly (no HTTP hop). Mutations go through `fetch` to Route Handlers. Agent-run status uses short polling (Realtime is optional). |
| Demo affordances | When `DEMO_MODE=true`: global "بيانات تجريبية" banner, persona quick-login, and "محاكاة" buttons for simulated actions. |

### 3.1 Route map

| Route | Audience | Purpose |
|---|---|---|
| `/login` | all | Supabase email/password login, plus a persona quick-login panel (demo mode only) |
| `/` | all | Redirect to the home page for the active org type |
| `/dashboard` | platform | **Main operational dashboard**: pipeline by state, pending gates, agent health |
| `/factories` | manufacturer (+ platform directory) | **Factory dashboard**: offers, incoming RFQs, quotes, counteroffers, POs, dispatch |
| `/distributors` | distributor (+ platform directory) | **Distributor dashboard**: same supplier workspace as `/factories`, scoped to distributor orgs |
| `/retailers` | retailer | **Inventory & purchasing**: stock table, Agent 1 run, draft demands, allocations, receipts |
| `/contractors` | contractor, project_owner | **Projects & requests**: phases, Agent 6 run, free-text request (Agent 1), demands, approvals |
| `/procurement` | platform (+ scoped views) | **Procurement** section overview, with two workspaces: |
| `/procurement/groups` | platform (+ buyer view of own memberships) | **Group purchasing workspace**: poolable demands, Agent 3, group detail, award, allocations |
| `/procurement/negotiations` | platform (+ supplier view of own) | **Quotes & negotiation workspace**: RFQs, quote comparison, Agent 4, counteroffer approvals |
| `/logistics` | all (scoped) | **Delivery & order tracking**: POs, Agent 5 plan, shipments timeline, receipt confirmation |
| `/agents` | platform (+ own-org runs for others) | **Agent monitoring**: runs list, run detail (input → tool calls → output), per-agent spec |
| `/settings/organization` | admin | Org profile and members (minimal) |

---

## 4. Backend

### 4.1 Layering (dependency direction is strictly downward)

```
app/api/** (Route Handlers)            ← HTTP, auth guard, Zod parse, error mapping
   ↓
src/server/workflow/**                 ← deterministic controller: transitions, gates, orchestration
src/server/services/**                 ← use-cases (non-workflow CRUD: inventory edit, offers, projects)
   ↓                    ↘
src/server/agents/**     src/server/db/** (repositories, Supabase clients)
   ↓
src/domain/**                          ← PURE functions: no IO, no Supabase, no OpenAI, fully unit-tested
```

Rules:
- `src/domain` imports nothing from `server`, `app` or external IO.
- Only `src/server/workflow` may call agents **and** persist their outputs. Route Handlers call the workflow or services, never the agent runtime directly.
- Only `src/server/db/admin.ts` creates the secret-key client. Only `src/server/workflow/**`, `src/server/services/**` and `scripts/**` may import it — never `app/**`, `src/components/**`, `src/server/agents/**` or `src/domain/**`. ESLint `no-restricted-imports` enforces this (Doc 7 §3).

### 4.2 API surface (Route Handlers, versioned `/api/v1`)

Every handler follows the same pattern: `requireSession()` → `requireMembership(orgId, roles)` → `Schema.parse(body)` → call workflow/service → typed JSON `{ data } | { error: { code, message_ar, details } }`.

| Method & path | Caller | Action |
|---|---|---|
| `POST /api/v1/agents/needs-inventory/run` | retailer/contractor member, platform | Agent 1 → draft demands |
| `POST /api/v1/agents/project-intelligence/run` | contractor/project_owner member | Agent 6 → draft demands + recommendations |
| `POST /api/v1/demands/:id/confirm` | buyer approver/member | **Gate H1**: confirm demand, set pooling consent and optional mandate |
| `POST /api/v1/groups/propose` | platform | Agent 3 → proposed groups |
| `POST /api/v1/groups/:id/approve` | platform approver | **Gate H2** |
| `POST /api/v1/groups/:id/discover-suppliers` | platform | Agent 2 → supplier shortlist |
| `POST /api/v1/groups/:id/rfqs` | platform approver | **Gate H3**: dispatch internal RFQs |
| `POST /api/v1/rfqs/:id/quotes` | supplier member | **H4**: submit quote |
| `POST /api/v1/groups/:id/negotiate` | platform | Agent 4 → analysis + draft counteroffers |
| `POST /api/v1/counteroffers/:id/approve` | platform approver | **Gate H5**: send counteroffer |
| `POST /api/v1/counteroffers/:id/respond` | supplier approver | **H6**: accept / reject / revise |
| `POST /api/v1/groups/:id/plan-logistics` | platform | Agent 5 → delivery plan + cost allocation |
| `POST /api/v1/groups/:id/award` | platform approver | **Gate H7**: approve award recommendation, compute allocations |
| `POST /api/v1/allocations/:id/decide` | buyer approver | **Gate H8**: approve/decline own allocation |
| `POST /api/v1/purchase-orders/:id/confirm` | supplier approver | **H9**: confirm PO |
| `POST /api/v1/shipments/:id/simulate` | supplier member (demo) | Simulated dispatch/deliver (labelled) |
| `POST /api/v1/receipts` | buyer member | **H10**: confirm receipt → inventory movement |
| `GET /api/v1/agent-runs/:id` | scoped | Run status/detail for polling |
| `POST /api/v1/demo/login` | anyone (demo mode only) | Server-side sign-in as a seeded persona |

Agent routes declare an explicit `maxDuration` (confirm the plan limit on Vercel in Stage 1) and use the Node runtime.

### 4.3 Error model

Typed `AppError` subclasses map to HTTP status codes. Messages for users are in Arabic; details are logged in English.

| Error | HTTP | Example |
|---|---|---|
| `ValidationError` | 400 | Zod parse failure |
| `UnauthenticatedError` | 401 | No session |
| `ForbiddenError` | 403 | Not a member, wrong role, wrong org type |
| `NotFoundError` | 404 | Entity missing or invisible under RLS |
| `InvalidTransitionError` | 409 | Group not in a state that allows the action |
| `GuardrailViolationError` | 422 | Agent output failed deterministic validation |
| `AgentExecutionError` | 502 | OpenAI failure, timeout, schema failure after repair |

---

## 5. Deterministic Workflow Controller (not an agent)

The controller is ordinary TypeScript. It contains **no LLM calls of its own**. It:
1. Checks that the requested transition is legal (`src/domain/state-machines`).
2. Gathers inputs for an agent from the database.
3. Invokes the agent runtime and receives a validated proposal.
4. Applies **guardrail validation** using domain functions (recompute, constraint checks).
5. Persists the accepted parts as *draft/proposed* records linked to the `agent_run_id`.
6. Records audit events and approval records at human gates.
7. Executes deterministic post-approval effects: allocations, PO generation, inventory postings.

### 5.1 Purchase-group state machine (core)

```
proposed ──H2──► approved ──H3──► rfq_sent ──(≥1 quote)──► quoting
   │                                                         │
   └─► cancelled ◄───────────── (any pre-award state) ◄──────┤
                                                             ▼
                          negotiating ◄── (Agent 4 run; H5 sends counteroffers; H6 responses)
                               │
                               ▼  (≥1 accepted offer + Agent 5 plan)
                          award_pending ──H7──► awaiting_buyer_approval
                                                     │ H8 (all members decide)
                                       ┌─────────────┴──────────────┐
                                       ▼                            ▼
                                po_issued                    requote_required
                     (H9 supplier confirms POs)          (tier broken by a decline)
                                       ▼
                                in_delivery ──(all receipts H10)──► completed
```

Other state machines (pure, unit-tested): `material_demand`, `rfq`, `quote`, `counteroffer`, `purchase_order`, `shipment`. All are defined in Doc 5 §3.

### 5.2 Determinism contract

- The same DB state plus the same agent output always produces the same persisted result.
- Rankings use explicit tie-breakers: landed cost ↑, lead time ↑, `supplier_org_id` lexical.
- Money is integer **baisa** (1 OMR = 1000 baisa). Rounding rules are centralised in `src/domain/money.ts`.

### 5.3 Human gates

| Gate | Actor | Commitment it authorises |
|---|---|---|
| H1 | Buyer (member+) | The demand is real; pooling consent; optional price mandate |
| H2 | Coordinator (approver) | Forming the group |
| H3 | Coordinator (approver) | Sending RFQs to a supplier list |
| H4 | Supplier (member+) | The supplier's own quote (supplier-authored, never AI-authored) |
| H5 | Coordinator (approver) | Sending a specific counteroffer |
| H6 | Supplier (approver) | Accept, reject or revise. **Acceptance exists only as this recorded action.** |
| H7 | Coordinator (approver) | Award recommendation |
| H8 | Each buyer (approver) | Buyer's own purchase commitment (allocation) |
| H9 | Supplier (approver) | Confirming the PO |
| H10 | Buyer (member+) | Received quantity, which triggers the inventory posting |

Every gate writes an `approvals` row (who, org, decision, timestamp, subject) and an `audit_events` row.

---

## 6. Authentication and authorisation

### 6.1 Authentication
- Supabase Auth with email/password. Server-side session handling through the Supabase SSR helpers and cookie-based sessions.
- A Next.js request interceptor (`middleware.ts`, or `proxy.ts` in newer Next.js majors — **confirm in Stage 1**) refreshes the session and redirects unauthenticated users to `/login`.
- Demo persona login: `POST /api/v1/demo/login` signs in server-side using seeded credentials from server env. It is disabled unless `DEMO_MODE=true`. No password ever reaches the client bundle.

### 6.2 Tenancy model
- `organizations` (with `org_type`) ← `memberships` (`user_id`, `org_id`, `role`) → `auth.users`.
- A user can belong to several orgs. The **active org** is held in a cookie and **re-verified against `memberships` on every request**.
- Roles: `admin` ⊃ `approver` ⊃ `member` ⊃ `viewer`. Commercial gates (H2, H3, H5, H6, H7, H8, H9) require `approver` or above.

### 6.3 Authorisation layers (defence in depth)
1. **Route guard**: session + membership + role + org type (`src/server/auth/guards.ts`).
2. **Workflow guard**: state-machine legality and per-gate actor rules.
3. **RLS**: Postgres enforces row visibility for every query made with the user client.
4. **Agent tool scope**: agents inherit the triggering user's RLS client, and tools also apply data minimisation (§7.4).

### 6.4 Two Supabase clients

| Client | Key | Used by | RLS |
|---|---|---|---|
| **User client** | publishable/anon key + user session cookie | **All reads**: Server Components, services, agent read tools | Enforced |
| **Admin client** | secret/service-role key | **All writes** (workflow controller and services, after guards; multi-row writes through atomic RPCs), seeding | Bypassed. Every call site must be preceded by explicit guard checks and must write an audit event |

**Write path:** RLS grants `authenticated` users `SELECT` policies only. With no `INSERT/UPDATE/DELETE` policies, direct writes using the publishable key are impossible, and every mutation passes through a guarded Route Handler (Doc 5 §1).

---

## 7. AI layer — OpenAI integration

### 7.1 Agent runtime (`src/server/agents/runtime`)

```
runAgent(agentKey, input, ctx)
  1. Load AgentDefinition (instructions, version, model config, allowedTools, input/output Zod)
  2. Zod-validate input            → AgentInputError (no API call made)
  3. Insert agent_runs row (status=running, input, model, prompt_version, triggered_by, org)
  4. Loop (max AGENT_MAX_TOOL_ITERATIONS):
       responses.create({ model, instructions, input: items,
                          tools: allowedTools→function schemas (strict),
                          text.format: output JSON schema (strict),
                          store: OPENAI_STORE_RESPONSES })
       if function_call items:
          for each call: ensure tool ∈ allowlist → Zod-parse args → execute(ctx) →
                         Zod-parse result → log agent_tool_calls → append function_call_output
          continue
       else: break
  5. Parse final output with Zod   → on failure: one repair turn → else AgentOutputError
  6. Update agent_runs (status=succeeded|failed, output, tokens, latency, response_ids, error)
  7. Return typed output to the workflow controller (which then applies guardrails)
```

- **API**: OpenAI **Responses API** with **function calling** (strict JSON-schema tools) and **structured outputs** (`text.format` json_schema). Use the official `openai` Node SDK and its Zod helpers where they are compatible with the pinned Zod version (verify in Stage 1).
- **Conversation state**: re-send accumulated input items (the model's output items plus `function_call_output` items) each turn. Default `store: false`. If the selected model is a reasoning model, carry encrypted reasoning items as the docs require. Fallback (documented decision): `store: true` + `previous_response_id`.
- **Model**: `OPENAI_MODEL` env (a current model with function calling and structured outputs, chosen in Stage 1). Per-agent overrides are allowed in the agent definition and logged per run.
- **Resilience**: SDK timeout (`OPENAI_TIMEOUT_MS`) and up to 2 retries on 429/5xx with backoff. No retries on 4xx validation errors.
- **Language**: agents reason in English. User-facing explanation fields (`*_ar`) are written in Modern Standard Arabic.

### 7.2 Tool registry (`src/server/agents/tools`)

Every tool is `{ name, description, kind: 'read' | 'compute', argsSchema, resultSchema, handler(ctx, args) }`.
- `read` tools query through `ctx.db` (the **user client**) and return minimised projections.
- `compute` tools call pure `src/domain` functions (pricing, compatibility, delivery cost), so arithmetic is never left to the model.
- **There are no write tools.** Agents cannot change state.

Doc 3 §3 has the full catalogue and per-agent allowlists.

### 7.3 Guardrails applied by the controller after each run
- Referential integrity: every ID in the output must exist and be visible to the triggering user.
- Recomputation: totals, tiered prices, landed costs and delivery costs are recomputed by domain functions. A mismatch beyond tolerance means the item is rejected and logged.
- Policy checks: pooling consent, specification compatibility, mandate ceilings, counteroffer bounds, capacity/MOQ, required-by feasibility.
- **Confidentiality leak filter** on supplier-facing text (counteroffer messages): it rejects text that mentions other supplier names, other prices, buyer names or mandate values.

### 7.4 Prompt-injection posture
- All user/supplier-authored text (free-text requests, quote notes) is passed as **JSON data fields**, never concatenated into instructions.
- Agents have no write tools, every output is schema-validated and re-checked, and every commercial effect requires a human gate. Injected text can therefore at worst produce a rejected or poor proposal.

---

## 8. End-to-end data flow (central scenario)

```
[Retailer A/B] inventory ──► Agent 1 ──► draft demands ──H1──► confirmed (consent ✓)
[Contractor C] project   ──► Agent 6 ──► draft demand  ──H1──► confirmed (consent ✓)
                                                                   │
                         Agent 3 (poolable demands) ◄──────────────┘
                              ▼  guardrail: same spec_key, window overlap, zone, consent
                         purchase_group(500, proposed) ──H2──► approved
                              ▼
                         Agent 2 (offers, capacity, zones, lead time) ──► shortlist ──H3──► RFQs
                              ▼
                         Suppliers submit quotes (H4, supplier UI)
                              ▼
                         Agent 4 (quotes, aggregated mandate ceiling, tiers) ──► counteroffers ──H5──► sent
                              ▼
                         Suppliers accept/reject/revise (H6, supplier UI)
                              ▼
                         Agent 5 (accepted offers, locations, rate cards) ──► delivery plan
                              ▼  controller: deterministic ranking by landed cost
                         award recommendation ──H7──► allocations (100/150/250 + delivery share)
                              ▼
                         Each buyer approves (H8) ──► 3 POs ──H9──► shipments (simulated)
                              ▼
                         Buyer confirms receipt (H10) ──► inventory_movements(+qty) ──► completed
```

All steps write `audit_events`, and every agent step writes `agent_runs` and `agent_tool_calls`.

---

## 9. Observability

| Signal | Where |
|---|---|
| Agent runs, tool calls, tokens, latency, errors | `agent_runs`, `agent_tool_calls` → `/agents` UI |
| Human decisions | `approvals` |
| State transitions & admin-client writes | `audit_events` |
| Server errors | Vercel function logs (structured `console` JSON with `request_id`, `agent_run_id`) |

---

## 10. Deployment topology

- **GitHub** repo → **Vercel** project (preview deployment per push, production on `main`).
- **Supabase** project (one for the hackathon; local Supabase CLI is optional). Choose the Supabase region first, then pin the Vercel function region next to it.
- Migrations live in `supabase/migrations` and are applied with the Supabase CLI. The seed is an idempotent script.
- Environment variables are configured in Vercel (Doc 5 §7). No secrets in the repo.

---

## 11. Key architecture decisions (Phase 0 log)

| ID | Decision | Rationale |
|---|---|---|
| AD-01 | Single Next.js app | 12-hour build; one deploy; shared types |
| AD-02 | Agents are read-only; the controller writes | Safety, auditability, deterministic state |
| AD-03 | Agent tools use the triggering user's RLS client | Tenant isolation extends into AI data access |
| AD-04 | Money as integer baisa | OMR has 3 decimals; avoid float drift |
| AD-05 | Platform org runs cross-tenant agents | Aggregation needs cross-org visibility, granted only to consented data via RLS |
| AD-06 | Suppliers see aggregated demand, not buyer identities, until PO | Buyer confidentiality |
| AD-07 | Route Handlers for mutations; Server Components for reads | Matches brief ("API routes"); HTTP-testable acceptance |
| AD-08 | No mock agent mode in the app | Brief requires live OpenAI agents; honesty |
| AD-09 | Polling for run status (Realtime optional) | Fewer moving parts |
| AD-10 | Typed dictionary i18n, Arabic only in MVP | Arabic-first; English can be added without refactor |
| AD-11 | RLS = read isolation + deny-all direct writes; writes server-mediated via admin client and atomic RPCs | One write path to guard and audit; no partial multi-row commits; far fewer policies to write in 12 h |
| AD-12 | Navigation follows the owner's Stage 1 sections: `/factories`, `/distributors`, `/retailers`, `/contractors`, `/procurement/{groups,negotiations}`, `/logistics`, `/agents` (replaces `/supplier`, `/retailer`, `/contractor`, `/groups`, `/negotiations`, `/deliveries`) | Owner instruction (Stage 1); same nine platform areas, clearer for users |

## 12. Open decisions (need owner input; defaults apply if no answer)

| # | Question | Default if unanswered |
|---|---|---|
| OD-1 | Which OpenAI model and budget? | Current general model with tools + structured outputs, chosen in Stage 1 |
| OD-2 | Supabase / Vercel regions and Vercel plan (function duration) | Closest available region to Oman for both; confirm `maxDuration` limit |
| OD-3 | Team size / parallel developers | Roadmap assumes 1 developer + Claude Code working sequentially |
| OD-4 | English UI toggle in MVP? | No (dictionary-ready only) |
