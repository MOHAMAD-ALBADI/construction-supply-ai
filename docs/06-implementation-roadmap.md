# Document 6 — 12-Hour Implementation Roadmap

> Assumes **one developer driving Claude Code, working sequentially** (OD-3). Times are cumulative from T+0:00.
> Every stage ends with the **checkpoint protocol** (§3). A stage is done only when its acceptance criteria pass **and** every earlier stage's acceptance still passes.

## 0. Prerequisites (before T+0:00 — owner provides)

| # | Item | Needed by |
|---|---|---|
| P-1 | Phase 0 documents approved | Stage 1 |
| P-2 | GitHub repository (empty) + access | Stage 1 |
| P-3 | Vercel account linked to GitHub; plan's function-duration limit known | Stage 1 |
| P-4 | Supabase project created (region chosen, OD-2); URL, publishable key and secret key available | Stage 3 |
| P-5 | OpenAI API key with credit; model choice confirmed (OD-1) | Stage 5 |
| P-6 | Node.js LTS, npm, Supabase CLI and Git installed locally | Stage 1 |

## 1. Critical path

```
S1 Scaffold ─► S2 Domain ─► S3 DB/RLS/Seed ─► S4 Auth/Shell ─► S5 Runtime+Agent1 ─► S6 Agent6+requests
   ─► S7 Groups+Agent3+Agent2+RFQ/Quotes ─► S8 Agent4 negotiation ─► S9 Agent5+Award+POs
   ─► S10 Delivery+Receipt ─► S11 Dashboard+E2E+Hardening ─► S12 Production+Rehearsal
```

## 2. Stages

### Stage 1 — Scaffold, version verification, foundations · T+0:00 → 0:45
**Depends on:** P-1, P-2, P-3, P-6
**Tasks**
1. Verify current stable versions and APIs in official docs: Next.js (incl. `middleware` vs `proxy` naming), React, Tailwind, shadcn/ui (incl. RTL guidance), `@supabase/supabase-js`, `@supabase/ssr`, `openai` (Responses API, function tools, structured outputs, Zod helpers), Zod, Vitest. Record the pinned versions and API notes in `CLAUDE.md` → "Pinned stack".
2. Create the Next.js app (TypeScript, App Router, `src/`, Tailwind, ESLint) and initialise shadcn/ui.
3. Create the folder skeleton (Doc 7 §2), `src/env.ts` (Zod), `.env.example`, `src/config/brand.ts`, `src/i18n/ar.ts`.
4. Root layout: `lang="ar" dir="rtl"`, Arabic font, `DirectionProvider`, theme tokens, synthetic-data banner placeholder.
5. Vitest config + one sample domain test. ESLint `no-restricted-imports` boundaries (Doc 7 §3). npm scripts: `typecheck`, `lint`, `test`, `build`, `verify`.
6. `git init`, first commit, push, connect Vercel, first preview deploy.

**Deliverables:** running preview URL; repo with skeleton; pinned versions recorded.
**Acceptance**
- [ ] `npm run verify` passes (typecheck, lint, test, build).
- [ ] Preview renders an Arabic RTL page whose title comes from `brand.ts`. Changing `NEXT_PUBLIC_BRAND_NAME_AR` changes it with no code change.
- [ ] `git grep -nE "sk-|sb_secret|service_role"` returns nothing.

### Stage 2 — Deterministic domain core · 0:45 → 1:45
**Depends on:** S1
**Tasks:** In `src/domain/` (pure, no IO): `money` (baisa, rounding, OMR formatting), `dates`, `reorder`, `spec-compatibility`, `group-compatibility`, `tiered-price`, `landed-cost`, `delivery-cost` (shipment cost rule + pro-rata allocation with deterministic remainder), `award` (award price rule, decline/requote rule), `order-by-date`, `leak-filter`, `state-machines/*` (all entities in Doc 5 §3.10), and Zod schemas for JSON columns (`price_tiers`, product `attributes`, `proposed_terms`).
**Deliverables:** domain modules + unit tests, including a `scenario.fixture.ts` encoding Doc 4 §5.
**Acceptance**
- [ ] `npm test` green; `src/domain` line coverage ≥ 85%.
- [ ] Fixture tests reproduce exactly: reorder 100 and 150; group total 500; order-by today+11; shares 11,000 / 16,500 / 27,500 baisa; group total 920,000 baisa.
- [ ] Each state machine rejects at least one illegal transition in tests.
- [ ] Leak filter rejects a message containing another supplier's name or a second price.

### Stage 3 — Database schema, RLS, read RPCs, seed · 1:45 → 3:00
**Depends on:** S2, P-4
**Tasks:** Migrations 1–8 (Doc 5 §9); generate TS types; `scripts/seed.ts` (personas, orgs, zones, products, equivalences, rate cards, offers, inventory, project/phases/BOQ, decoy demands); `scripts/reset-demo.ts`; `scripts/check-isolation.ts` (AT-1); SQL check that every `public` table has RLS enabled.
**Deliverables:** schema on the hosted Supabase; idempotent seed; isolation script.
**Acceptance**
- [ ] Migrations apply cleanly to an empty database.
- [ ] Running the seed twice creates no duplicates (row counts identical).
- [ ] RLS-enabled check: zero `public` tables without RLS.
- [ ] `check-isolation` passes: retailer_a ↛ retailer_b inventory/demands; supplier ↛ other suppliers' offers; buyers ↛ supplier offers; any insert with the publishable key is denied.

### Stage 4 — Auth, tenancy, app shell · 3:00 → 4:00
**Depends on:** S3
**Tasks:** Supabase user/admin/browser clients; session-refresh interceptor; `/login`; `POST /api/v1/demo/login` (demo mode only); active-org cookie + switcher; guards (`requireSession`, `requireMembership`, `requireRole`, `requireOrgType`); API error mapping + `audit()` helper; role-aware sidebar; home redirect by org type; RTL skeleton pages for all nine areas with empty states.
**Deliverables:** navigable, authenticated shell for all personas.
**Acceptance**
- [ ] All 7 personas log in via quick-login and land on the correct home page.
- [ ] Unauthenticated access to any app route redirects to `/login`; a retailer opening `/dashboard` gets a 403 page.
- [ ] `DEMO_USER_PASSWORD` is absent from `.next/static` (grep).
- [ ] With `DEMO_MODE=false`, the demo login route returns 404.

### Stage 5 — Agent runtime, monitoring, Agent 1 live · 4:00 → 5:15
**Depends on:** S4, P-5
**Tasks:** server-only OpenAI client; `runAgent` loop (Doc 2 §7.1) with strict tool schemas and structured output; tool registry + allowlist enforcement; run/tool-call logging; error taxonomy and repair turn; runner unit tests with a fake client (tests only). Agent 1: definition, contract, 4 tools, guardrails. Retailer page: inventory table, "Analyse inventory", draft-demand cards, H1 dialog (required_by, consent, mandate) + migration with `rpc_confirm_demand`. `/agents` list and run-detail pages.
**Deliverables:** first live agent end-to-end; monitoring UI.
**Acceptance**
- [ ] Live Agent 1 proposes 100 (retailer_a) and 150 (retailer_b); guardrail recomputation matches.
- [ ] The run detail shows input, every tool call, output, tokens, latency and OpenAI response ID.
- [ ] A forced failure (e.g. a timeout set to 1 ms in a test env) records `failed` with an error code. The UI shows the failure and no fabricated proposal.
- [ ] A call to a non-allowlisted tool is refused (unit test).
- [ ] H1 writes the demand status, an `approvals` row and an `audit_events` row.

### Stage 6 — Contractor projects, Agent 6, free-text requests · 5:15 → 6:15
**Depends on:** S5
**Tasks:** contractor page (projects, phases, BOQ); `rpc_product_lead_time_stats`; Agent 6 (5 tools, guardrails) → recommendations + draft demands; free-text request form → Agent 1 request mode; H1 for contractor demands.
**Acceptance**
- [ ] Agent 6 recommends 250 bags, order-by = today+11, `pooling_suggested = true`.
- [ ] A `planned` (non-approved) phase never yields `create_demand` (guardrail test).
- [ ] "أحتاج 250 كيس إسمنت بورتلاندي مقاومة 42.5" maps to `P-OPC425-50`; an unknown material lands in `unmatched_items`.

### Stage 7 — Group purchasing, Agent 3, Agent 2, RFQs, supplier quoting · 6:15 → 7:30
**Depends on:** S6
**Tasks:** `/groups` (poolable demands, Agent 3 run, proposed groups, H2); Agent 2 on the group (shortlist with exclusions, supplier selection, H3); `/supplier` RFQ inbox (aggregated, buyer-anonymous) + quote form (H4); group timeline component; RPCs `rpc_create_proposed_groups`, `rpc_approve_group`, `rpc_dispatch_rfqs`, `rpc_submit_quote`.
**Acceptance**
- [ ] Agent 3 proposes one group: 500 bags, 3 distinct buyers. The non-consented decoy is absent; the OPC 52.5R decoy appears in `ungrouped_demands`.
- [ ] RFQs exist only for coordinator-selected suppliers.
- [ ] The supplier RFQ view contains no buyer org name or ID (isolation script extended).
- [ ] factory_b cannot read factory_a's quote.

### Stage 8 — Negotiation workspace, Agent 4 · 7:30 → 8:30
**Depends on:** S7
**Tasks:** `/negotiations` comparison table (domain-computed); `rpc_group_mandate_ceiling`; Agent 4 (5 tools, bounds + leak-filter guardrails) → draft counteroffers; H5 approve/discard; supplier counteroffer inbox + H6 accept/reject/counter; RPCs `rpc_create_counteroffers`, `rpc_send_counteroffer`, `rpc_respond_counteroffer`.
**Acceptance**
- [ ] Every persisted counteroffer satisfies `quoted × (1 − max_ask) ≤ proposed ≤ min(quoted, ceiling)`.
- [ ] A counteroffer becomes `accepted` only through the supplier route, with `responded_by` = a supplier-org user (DB assertion).
- [ ] Suppliers never see `draft`/`discarded` counteroffers, the internal rationale, the ceiling or other quotes.

### Stage 9 — Logistics (Agent 5), award, buyer approvals, POs · 8:30 → 9:30
**Depends on:** S8
**Tasks:** Agent 5 (4 tools, guardrails) → plans; plan comparison view; H7 award (domain allocations); allocation cards on buyer dashboards with H8; PO generation; supplier PO list + H9; RPCs `rpc_save_delivery_plan`, `rpc_award_group`, `rpc_decide_allocation`, `rpc_confirm_po`.
**Acceptance**
- [ ] Allocations (qty and baisa) sum exactly to the group totals.
- [ ] Three POs (100/150/250) are issued only after all three H8 approvals; each is labelled "محاكاة — بدون دفع".
- [ ] The decline path leads to `requote_required` when the tier breaks (domain test + API test).
- [ ] The supplier sees buyer identity only on POs.

### Stage 10 — Delivery tracking & receipt → inventory · 9:30 → 10:15
**Depends on:** S9
**Tasks:** `/deliveries` per persona (POs, shipments, stop timeline); simulated dispatch/deliver (labelled, audited `is_simulated`); H10 receipt form; `rpc_simulate_shipment`, `rpc_post_goods_receipt`; group completion.
**Acceptance**
- [ ] AT-7: retailer_a's on_hand stays 50 through PO, dispatch and delivery, and becomes 150 only after H10. Exactly one `receipt` movement row exists.
- [ ] The group reaches `completed` after all receipts; POs reach `fulfilled`.

### Stage 11 — Operational dashboard, E2E, hardening · 10:15 → 11:15
**Depends on:** S10
**Tasks:** `/dashboard` (groups by state, pending gates by persona, agent runs and failures, synthetic-data difference widget clearly labelled); `scripts/e2e-scenario.ts` (AT-6), `scripts/agents-smoke.ts` (AT-5); loading/empty/error states; RTL review; dictionary key check (AT-8); security pass (secret grep, RLS check, boundary lint, admin-client call-site review).
**Acceptance**
- [ ] AT-1 … AT-8 all pass against the preview deployment.
- [ ] `npm run verify` passes with zero lint warnings.
- [ ] The dashboard numbers match direct SQL counts.

### Stage 12 — Production promotion & rehearsal · 11:15 → 12:00
**Depends on:** S11
**Tasks:** set production env vars; confirm migrations and seed on production Supabase; merge to `main`; run AT-9; two timed rehearsals with `reset-demo` between them; tag `v0.1.0-demo`. Optional: screen-record one real run as a **clearly labelled recording** backup.
**Acceptance**
- [ ] The production URL completes the full scenario twice in ≤ 10 minutes each.
- [ ] Tag created; `CLAUDE.md` status updated.

## 3. Checkpoint protocol (end of every stage)

1. `npm run verify` (typecheck → lint → test → build).
2. **Regression**: rerun the acceptance scripts of all previous stages (`check-isolation`, domain tests, and later `e2e-scenario` up to the current step).
3. Update `CLAUDE.md` → "Current stage" and any new commands or decisions.
4. Commit with a conventional message, tag `stage-N`, push, and confirm the Vercel preview is green.
5. Post a checkpoint report: done / not done / deviations from docs / risks / next stage.
6. **Stop for owner approval** before the next stage, unless the owner has given standing approval for consecutive stages.

**Overrun rule:** if a stage runs more than 15 minutes over its time box, apply the next item of the Doc 4 §7 cut-line and record it in the checkpoint report.

## 4. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | OpenAI latency/timeouts across six agents | Small, pre-minimised tool payloads; low reasoning effort if applicable; explicit `maxDuration`; progress UI; one agent per request |
| R2 | Model does arithmetic itself or skips tools | Instructions mandate compute tools; guardrails recompute everything; consider forcing a tool call on the first turn |
| R3 | RLS mistakes leak tenant data | Isolation script from Stage 3, rerun at every checkpoint; deny-all writes |
| R4 | Strict structured-output incompatibilities | Rule: no optional fields (nullable instead); contract test converts every output schema |
| R5 | RTL glitches in components | `DirectionProvider`, logical utilities only, review budget in Stage 11 |
| R6 | Vercel function duration limit | Confirm in Stage 1; keep agent loops ≤ 8 iterations |
| R7 | Time overrun | Time boxes, overrun rule, cut-line |
| R8 | OpenAI outage during the demo | No fake output; show the failed-run handling honestly; optional labelled recording of a real run |
| R9 | Library API drift since training data | Stage 1 verification; exact version pins |
| R10 | Stale seed dates | All seed dates relative to today; `reset-demo` |
