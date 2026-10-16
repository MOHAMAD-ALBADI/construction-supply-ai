# Document 7 — Engineering Rules

> These rules bind every coding stage and every Claude Code session.
> **Precedence:** owner's explicit instruction > `CLAUDE.md` > Docs 01–07 > existing code patterns > personal preference.
> If code and docs disagree, stop and resolve it. Either fix the code, or update the doc with owner approval.

---

## 1. Non-negotiables

1. Exactly **six** AI agents (Doc 3). The workflow controller is deterministic code.
2. All six agents use the **OpenAI Responses API live** in the running app. No canned or mock outputs outside automated tests.
3. **Agents never write.** Only the workflow controller and services write, after guards.
4. **Every number that matters is computed by `src/domain`** and re-verified after any agent run.
5. **Human gates H1–H10** precede every commercial effect. Supplier acceptance is only ever a supplier user's action.
6. **RLS on every table.** No write policies for `anon`/`authenticated`.
7. **Secrets stay server-side.** Nothing secret is ever passed to a `"use client"` module or a `NEXT_PUBLIC_*` variable.
8. **Synthetic data and simulated actions are always labelled** in the UI and in `audit_events.is_simulated`.
9. **No fabricated statistics, savings or traction**, in code, seed, UI copy or agent prompts.
10. **Arabic-first RTL.** No hard-coded UI strings; brand only from `src/config/brand.ts`.

---

## 2. Repository layout

```
/
├─ CLAUDE.md                     # concise operating guide (keep current)
├─ docs/                         # 01–07: source of truth
├─ supabase/migrations/          # SQL, timestamped, additive only
├─ scripts/                      # seed, reset-demo, check-isolation, agents-smoke, e2e-scenario
└─ src/
   ├─ app/
   │  ├─ (auth)/login/
   │  ├─ (app)/{dashboard,supplier,retailer,contractor,negotiations,groups,deliveries,agents,settings}/
   │  ├─ api/v1/**/route.ts      # thin: guard → parse → call → map
   │  └─ layout.tsx              # lang="ar" dir="rtl"
   ├─ components/{ui,layout,<area>}/
   ├─ config/brand.ts
   ├─ i18n/{ar.ts,en.ts,index.ts}
   ├─ env.ts                     # Zod-validated env (server/public split)
   ├─ domain/                    # PURE logic + JSON-column Zod schemas (+ *.test.ts)
   │  └─ state-machines/
   ├─ schemas/                   # Zod API request/response schemas
   ├─ lib/                       # client-safe helpers (formatting, cn)
   └─ server/
      ├─ auth/                   # session, active org, guards
      ├─ db/{user.ts,admin.ts,types.gen.ts,repositories/}
      ├─ services/               # non-workflow use-cases
      ├─ workflow/               # controller, gates, step handlers
      ├─ agents/
      │  ├─ runtime/             # openai client, runAgent, schema conversion, logging, errors
      │  ├─ tools/               # registry + tool implementations
      │  └─ {needs-inventory,supplier-discovery,group-procurement,negotiation,logistics,project-intelligence}/
      ├─ audit.ts
      └─ errors.ts
```

Unit tests are colocated (`*.test.ts`). Cross-layer scripts live in `scripts/`.

---

## 3. Layer boundaries (enforced by ESLint `no-restricted-imports` + review)

| Module | May import | Must NOT import |
|---|---|---|
| `src/domain/**` | `zod`, other domain modules | anything in `server/`, `app/`, Supabase, OpenAI, `next/*` |
| `src/server/agents/**` | domain, `server/db/user.ts`, repositories (read), runtime | `server/db/admin.ts`, `services/`, `workflow/` |
| `src/server/workflow/**` | agents, services, domain, db (user + admin), audit | `app/`, components |
| `src/server/services/**` | domain, db (user + admin), audit | agents, `app/`, components |
| `src/app/api/**` | auth guards, workflow, services, schemas, errors | agents runtime directly, `db/admin.ts` |
| `src/app/(app)/**` pages | services (reads), components, i18n | `db/admin.ts`, agents, workflow (mutations go via API) |
| `src/components/**` | ui, lib, i18n, config | anything under `server/` |

Every module under `src/server/**` begins with `import "server-only"`.

---

## 4. Database rules

1. **Migrations are additive.** Never edit a migration that has been applied. Create a new one. Dropping or renaming a table, column or enum value needs owner approval and a doc update.
2. **Every `CREATE TABLE` is followed in the same migration by `ENABLE ROW LEVEL SECURITY`** and its SELECT policies (Doc 5 §4).
3. No `INSERT/UPDATE/DELETE` policies for `anon`/`authenticated`. Writes go through the admin client from `workflow/`/`services/`.
4. Multi-row commercial writes use an **atomic RPC** that re-checks the state precondition. Each write RPC gets `REVOKE EXECUTE … FROM anon, authenticated`.
5. Security-definer functions set `search_path` explicitly and return minimised columns.
6. Regenerate `src/server/db/types.gen.ts` after every migration. Never hand-edit it.
7. Money columns: `bigint` baisa, named `*_baisa`. Quantities: `integer`. Never `numeric` or `float` for money.
8. Seed and reset scripts stay idempotent and use relative dates.

---

## 5. Agent rules

1. The set of agents is fixed (Doc 3). Adding, removing, merging or renaming an agent is a **spec change** that requires owner approval.
2. Each agent folder has exactly: `definition.ts`, `contract.ts`, `guardrails.ts`, `index.ts` (+ tests).
3. **Any instruction change bumps `version`**. The runtime logs `instructions_hash` per run.
4. Tools are `read` or `compute` only. A new tool must have Zod args and result schemas, be registered, and be added to the **allowlist matrix in Doc 3 §3 in the same change**.
5. **Output schemas must be strict-structured-output compatible:** every property required (use `.nullable()` for absent values); no open-ended records; no `.default()`; no root-level unions; `additionalProperties: false`. The contract test must convert each schema successfully.
6. **No LLM number is persisted unverified.** Each numeric output field has a guardrail that recomputes or bounds-checks it.
7. User- or supplier-authored text enters agents **only as JSON data fields**, never by concatenation into instructions.
8. Supplier-facing text produced by an agent must pass `domain/leak-filter` before it is persisted.
9. Test doubles for the OpenAI client live only in test files and are injected through the runtime's client parameter. There is **no** env flag that switches the app into a mock mode.
10. Keep tool results small (only the fields the agent needs). This is better for privacy, latency and cost.

---

## 6. UI, i18n, RTL and branding rules

1. **No literal UI strings in components.** Use `t("area.key")` from `src/i18n/ar.ts`, with keys namespaced by area. A matching key in `en.ts` is optional in the MVP.
2. **Use the glossary** (Doc 1 §9) for all domain terms.
3. **Logical direction only:** `ms-/me-/ps-/pe-/start-/end-/text-start/text-end`, `border-s/e`, `rounded-s/e`. Forbidden: `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right` (checked by a grep in `verify`). Directional icons get an RTL flip class.
4. **Brand**: names, logo and colours come only from `src/config/brand.ts` (env-overridable). The codename "Construction Supply AI" must not appear in `src/`.
5. **Formatting** goes through `lib/format.ts` only: `formatOMR(baisa)` (3 decimals), `formatQty`, `formatDate` (`ar-OM`, Latin digits, Gregorian, `Asia/Muscat`).
6. **Simulation & synthetic labels**: use `<SimulatedBadge/>` on every simulated action, button and record, and the global `<SyntheticDataBanner/>` when `NEXT_PUBLIC_DEMO_MODE=true`. Commercial screens state "الأسعار لا تشمل ضريبة القيمة المضافة (غير محتسبة)".
7. **Agent output in the UI** is labelled with the agent's Arabic name, version and a link to the run in `/agents`. Never present an agent proposal as a decision.
8. Server Components by default; `"use client"` only for interactive leaves. Every async view has loading, empty and error states.
9. Function over decoration: shadcn primitives, consistent spacing, accessible labels, visible focus, sufficient contrast, responsive down to 360 px.

---

## 7. TypeScript and code conventions

| Topic | Rule |
|---|---|
| Compiler | `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; use `unknown` and narrow it. No `@ts-ignore` (`@ts-expect-error` with a reason only in tests) |
| Naming | Files `kebab-case.ts`; components `PascalCase`; functions/vars `camelCase`; constants `SCREAMING_SNAKE`; Zod `FooSchema` + `type Foo = z.infer<typeof FooSchema>` |
| Data shapes | **snake_case end-to-end** for DB rows, API JSON and agent contracts (no mapping layer); camelCase for code identifiers |
| Validation | Zod at every boundary: env, API input, API output to client, JSON columns, agent input/output, tool args/results |
| Errors | Throw typed `AppError` subclasses (Doc 2 §4.3). No empty `catch`. No swallowed promise rejections. User messages in Arabic, logs in English |
| Time | Inject a clock (`now()`) into domain functions; never call `new Date()` inside domain logic |
| Money | Branded `Baisa` integer type; arithmetic only in `domain/money.ts` helpers; format at the UI edge only |
| Comments | Explain *why*, not *what*. Reference doc sections (e.g. `// Doc 5 §3.10 award price rule`) for business rules |
| Dependencies | No new dependency without a one-line justification in `CLAUDE.md` → "Pinned stack". Prefer platform and std-lib features |

---

## 8. API rules

1. Route Handlers stay thin: `requireSession → requireMembership/role/orgType → Schema.parse → workflow/service → respond`.
2. Response envelope: `{ data }` or `{ error: { code, message_ar, details? } }` with the HTTP status from Doc 2 §4.3.
3. Mutations are `POST` and idempotency-safe where practical: a repeated gate action returns the current state and does not throw a 500.
4. Agent routes declare `runtime = "nodejs"` and an explicit `maxDuration`.
5. The acting org is the verified active org, never an `org_id` taken from the request body without a membership check.

---

## 9. Security rules

1. `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` and `DEMO_USER_PASSWORD` are read only in `server-only` modules.
2. Never log secrets, raw auth cookies or full JWTs. Tool-call logs are truncated (≤ 8 KB).
3. Every admin-client write is preceded by guard checks and followed by `audit()`.
4. Confidentiality (Doc 1 §5, item 4): suppliers never receive competitor data or buyer identity before a PO; buyers never receive raw quotes; mandates stay with the buyer and the platform.
5. No outbound calls to anything except Supabase and OpenAI. No email, SMS, scraping or contact with real suppliers.
6. Demo-only routes and actions check `DEMO_MODE` on the server and return 404 when it is off.
7. Never disable RLS, widen a policy or skip a guard to "make it work". Fix the root cause.

---

## 10. Testing requirements

| Layer | Required tests | Tool |
|---|---|---|
| Domain | Every exported function: happy path, boundaries, invalid input; scenario fixture (Doc 4 §5); all state machines with legal and illegal transitions | Vitest |
| Agents | Contract (schema accept/reject + strict conversion), allowlist refusal, guardrail rejection cases, runner loop with fake client (tool loop, repair, failure) | Vitest |
| DB / RLS | Isolation script per persona (AT-1); RLS-enabled check; publishable-key write denial; RPC preconditions (illegal transition rejected) | `scripts/check-isolation.ts` |
| Workflow / API | Full scenario through the API as personas (AT-6); inventory-only-on-receipt (AT-7) | `scripts/e2e-scenario.ts` |
| Live AI | Each agent once on seed data (AT-5) — manual, costs tokens | `scripts/agents-smoke.ts` |
| UI | Dictionary key completeness; RTL grep; manual persona walkthrough | script + manual |

Rules:
- `npm run verify` must pass before every commit.
- Automated tests never call the real OpenAI API. Only `agents:smoke` and the live demo do.
- **A previously passing acceptance test may not be weakened or deleted** to make a new change pass, unless the spec changed with owner approval.
- Bug fixes come with a test that would have caught the bug.

---

## 11. Git and delivery workflow

1. `main` is always deployable. Work happens on `stage-N-<slug>` branches, which merge to `main` at the checkpoint.
2. Conventional commits (`feat(groups): …`, `fix(rls): …`, `test(domain): …`, `docs: …`), small and focused.
3. Never commit `.env*` files except `.env.example`.
4. Tag each completed stage `stage-N`. Tag the demo build `v0.1.0-demo`.
5. Vercel preview per branch. Production deploys from `main` only.

---

## 12. Safe-modification practices (for every Claude Code session)

1. **Orient first:** read `CLAUDE.md`, the doc sections for the current stage, and the code you will touch. Follow existing patterns.
2. **Stay in scope:** implement only the current stage's tasks. No drive-by refactors, renames, reformatting or "improvements" outside it.
3. **Contracts are shared:** changing an API schema, agent contract, enum, RPC signature or table means updating every consumer **and** the docs in the same change.
4. **Verify, don't assume:** confirm library APIs against official docs when unsure, and record notable findings in `CLAUDE.md`.
5. **Preserve working functionality:** run the regression set before declaring a stage done. If an earlier test breaks, fix the code.
6. **Ask, don't invent:** if a requirement is ambiguous or missing, stop and ask the owner. Do not add features, agents or integrations not in Doc 4.
7. **Report honestly:** checkpoint reports list what failed, what was skipped and what was cut, with evidence (command output).
8. **Destructive operations** (dropping data, force-push, resetting the production DB, deleting files) require explicit owner confirmation.

---

## 13. Definition of Done (feature level)

- [ ] Meets its acceptance criteria in Doc 6 and its Doc 4 entry.
- [ ] Zod validation at all new boundaries; typed errors mapped.
- [ ] Domain logic in `src/domain` with tests; numbers verified after agents.
- [ ] RLS covers any new table; isolation script updated if visibility changed.
- [ ] Audit events and approvals written for gates and admin writes.
- [ ] Arabic strings in the dictionary; RTL-safe classes; simulated/synthetic labels where relevant.
- [ ] `npm run verify` green; regression green; docs and `CLAUDE.md` updated if anything changed.

## 14. Change control

A change to scope, agents, data model or workflow:
1. is proposed to the owner with its impact (stage, time, risk);
2. once approved, is written into the affected doc(s) and appended to the decision log (Doc 2 §11, next `AD-xx`);
3. only then is it implemented.
