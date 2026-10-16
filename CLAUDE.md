# CLAUDE.md — Construction Supply AI (codename)

Arabic-first, multi-tenant, AI-assisted construction-materials procurement platform for Oman (GCC later). It connects manufacturers, distributors, retailers, contractors and project owners. Six OpenAI agents **propose**; a deterministic workflow controller **validates and persists**; humans **approve** every commercial commitment. This is a 12-hour hackathon MVP.

## Status
- Phase 0 (foundation docs): complete.
- **Stage 1 (scaffold): complete locally** — `npm run verify` green, tag `stage-1`. Pending: first push to GitHub (owner must refresh the GitHub login on this machine) → link Vercel project → preview deploy.
- Next: Stage 2 (deterministic domain core). Update these lines at every checkpoint.

## Source of truth — read the relevant doc before coding
| Doc | Use it for |
|---|---|
| [docs/01-master-product-brief.md](docs/01-master-product-brief.md) | Product, personas, confidentiality model, **Arabic glossary** |
| [docs/02-system-architecture.md](docs/02-system-architecture.md) | Layers, routes, API, controller, gates H1–H10, auth, AI runtime, decisions log |
| [docs/03-six-agent-specification.md](docs/03-six-agent-specification.md) | The six agents: contracts, tools, allowlists, guardrails, instructions |
| [docs/04-mvp-scope.md](docs/04-mvp-scope.md) | M/S/X scope, **exact 500-bag demo scenario**, acceptance tests, cut-line |
| [docs/05-database-integration-blueprint.md](docs/05-database-integration-blueprint.md) | Entities, enums, state machines, RLS matrix, RPCs, env vars, seed |
| [docs/06-implementation-roadmap.md](docs/06-implementation-roadmap.md) | Stages 1–12, acceptance criteria, checkpoint protocol, risks |
| [docs/07-engineering-rules.md](docs/07-engineering-rules.md) | Conventions, boundaries, testing, safe-modification rules |

## Non-negotiables (details: Doc 7 §1)
1. Exactly **six** agents: `needs_inventory`, `supplier_discovery`, `group_procurement`, `negotiation`, `logistics`, `project_intelligence`. The controller is **not** an agent.
2. Agents run live on the OpenAI Responses API, are **read-only** (read/compute tools only), and never fake output.
3. All business numbers come from `src/domain` (pure, tested). Money = integer **baisa**.
4. Human gates H1–H10 before every commercial effect. Supplier acceptance = a supplier user's action only.
5. RLS on every table; users get SELECT only; writes are server-mediated (admin client + atomic RPCs + audit).
6. Secrets server-only. Synthetic data and simulated actions are always labelled. No fabricated stats.
7. Arabic RTL first: dictionary strings, logical CSS only, brand from `src/config/brand.ts`.

## Stack (pin exact versions in Stage 1 after checking official docs)
Next.js App Router + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres, Auth, RLS) · OpenAI Responses API (function calling + structured outputs) · Zod · Vitest · Vercel · GitHub

### Pinned stack (verified 2026-10-16)
| Package | Version | Notes |
|---|---|---|
| next / eslint-config-next | 16.4.2 | **`middleware.ts` is deprecated → use `src/proxy.ts`** (`export function proxy`), Node runtime by default. Bundled docs: `node_modules/next/dist/docs/` — read them before using any Next API (see `AGENTS.md`). `cacheComponents`/`partialPrefetching` from the template are **off** (all pages are per-user, cookie-based). Typed `LayoutProps`/`PageProps` come from `next typegen`. |
| react / react-dom | 19.3.0 | |
| tailwindcss / @tailwindcss/turbopack | 4.x | CSS loaded via the Turbopack loader in `next.config.ts` (no PostCSS config) |
| zod | 4.6.7 | Use v4 APIs (`z.url()`, `z.toJSONSchema`) |
| vitest / @vitest/coverage-v8 | 5.0.5 | `server-only` is stubbed in `vitest.config.ts`. Requires `@types/node` ≥ 22 (template's ^20 bumped to ^22) and Node ≥ 22.12 |
| server-only | 0.0.1 | First import of every `src/server/**` module |
| typescript / eslint | ^5 / ^9 | Template's ranges (eslint-config-next compatibility); lockfile pins exact |
| @supabase/supabase-js / @supabase/ssr | 2.118.0 / 0.12.7 | Add in Stage 3/4 |
| openai | 7.34.0 | Add in Stage 5; peer `zod ^3.25 \|\| ^4.0` ✓ |

Add-on dependency justifications go in this table.

## Environment & services
| Service | Value | Notes |
|---|---|---|
| Supabase | project ref `xxjzlshtkostlsnnwige` (dedicated hackathon org) | MCP in `.mcp.json`, project-scoped, features `database,docs,debugging,development`. **Before any DB action, confirm `get_project_url` returns this ref** — the owner has other, unrelated live projects. |
| GitHub | `MOHAMAD-ALBADI/construction-supply-ai` (remote `origin`, branch `main`) | Push via git; GitHub MCP not configured |
| Vercel | Owner account, **Hobby plan** | MCP connected; confirm function `maxDuration` limit in Stage 1 |
| OpenAI | key goes in `.env.local` / Vercel env only | Never paste keys in chat or commit them |
| Local | Node 22, npm 10, Git 2.55; Supabase CLI and `gh` **not installed** | Apply migrations through the Supabase MCP unless the CLI is installed later |

## Layering (Doc 7 §3)
`app/api` (thin) → `server/workflow` | `server/services` → `server/agents` (read-only) | `server/db` → `domain` (pure).
The admin client (`server/db/admin.ts`) may be imported only by `workflow/`, `services/` and `scripts/`.

## Commands
| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run verify` | typecheck → lint (0 warnings) → check:rtl → test → build. **Must pass before every commit** |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm test` | Vitest (unit tests colocated as `*.test.ts`) |
| `npm run check:rtl` | Fails on physical-direction Tailwind classes (`ml-`, `text-left`, …) |

Planned in later stages: `db:seed`, `db:reset-demo`, `check:isolation`, `agents:smoke` (real API, costs tokens), `e2e:scenario`.

## Working rules for each session
- Work on **one stage at a time** (Doc 6). Implement only that stage's tasks.
- At the end of a stage, run the checkpoint protocol (Doc 6 §3): verify → regression → update this file → commit/tag → report → **wait for owner approval**.
- Read before editing; follow existing patterns; no drive-by refactors; never weaken a passing test.
- Ambiguity or scope change → ask the owner; approved changes go into the docs first (Doc 7 §14).
- Never disable RLS, expose secrets, add a seventh agent, or contact real external parties.
