# Document 5 — Database and Integration Blueprint

> This is a **logical** design. **No migrations are generated in Phase 0.** Column lists are the minimum the MVP needs; implementation may add timestamps and indexes but must not drop or rename these concepts without updating this document first.
> Conventions: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz` where mutable. Money = `bigint` **baisa**. Quantities = `integer` in the product's unit. Dates = `date`; instants = `timestamptz` (UTC; displayed in `Asia/Muscat`).

---

## 1. Multi-tenant isolation model

### 1.1 Principles
1. **Every table has RLS enabled.** No exceptions, including reference tables.
2. **Reads**: `authenticated` users get `SELECT` policies scoped by organisation membership (§4).
3. **Writes are server-mediated.** There are **no** `INSERT/UPDATE/DELETE` policies for `anon` or `authenticated`, so direct writes with the publishable key are impossible. The server performs every write with the admin (secret-key) client, **after** route + workflow guards, and records an `audit_events` row.
4. **Multi-row commercial writes are atomic** through Postgres functions (§5). The TypeScript domain computes the values; the RPC re-checks the state precondition and writes everything in one transaction. `EXECUTE` on these RPCs is granted to `service_role` only.
5. Ownership columns: `org_id` for the owning tenant; `buyer_org_id` / `supplier_org_id` where a row belongs to a counterparty relationship.

### 1.2 RLS helper functions (`app` schema, `stable`, `security definer`, fixed `search_path`)

| Function | Returns |
|---|---|
| `app.my_org_ids()` | `setof uuid` — orgs where `memberships.user_id = auth.uid()` |
| `app.has_role(org uuid, min_role member_role)` | `boolean` — role-rank comparison |
| `app.is_platform()` | `boolean` — user belongs to an org with `org_type = 'platform'` |

---

## 2. Enumerations

| Enum | Values |
|---|---|
| `org_type` | `platform`, `manufacturer`, `distributor`, `retailer`, `contractor`, `project_owner` |
| `member_role` | `admin`, `approver`, `member`, `viewer` (rank 4 → 1) |
| `location_kind` | `plant`, `warehouse`, `store`, `site` |
| `phase_status` | `planned`, `approved`, `in_progress`, `completed`, `on_hold` |
| `demand_source` | `manual`, `needs_inventory`, `project_intelligence` |
| `demand_status` | `draft`, `confirmed`, `grouped`, `ordered`, `fulfilled`, `cancelled` |
| `group_status` | `proposed`, `approved`, `rfq_sent`, `quoting`, `negotiating`, `award_pending`, `awaiting_buyer_approval`, `requote_required`, `po_issued`, `in_delivery`, `completed`, `cancelled` |
| `member_status` | `proposed`, `active`, `allocated`, `approved`, `declined`, `withdrawn` |
| `rfq_status` | `sent`, `quoted`, `declined`, `expired`, `closed` |
| `quote_status` | `submitted`, `superseded`, `awarded`, `not_awarded`, `withdrawn` |
| `counteroffer_status` | `draft`, `discarded`, `sent`, `accepted`, `rejected`, `countered` |
| `plan_status` | `proposed`, `approved`, `superseded` |
| `po_status` | `issued`, `confirmed`, `fulfilled`, `cancelled` |
| `shipment_status` | `planned`, `scheduled`, `dispatched`, `delivered`, `cancelled` |
| `stop_status` | `pending`, `delivered`, `received` |
| `movement_type` | `opening_balance`, `receipt`, `sale`, `adjustment` |
| `gate` | `H1` … `H10` |
| `decision` | `approved`, `rejected` |
| `agent_key` | the six keys of Doc 3 |
| `agent_run_status` | `running`, `succeeded`, `failed`, `rejected` |
| `actor_type` | `user`, `agent`, `system` |

---

## 3. Entities

### 3.1 Tenancy & identity
| Table | Key columns | Notes |
|---|---|---|
| `organizations` | `slug` (unique), `name_ar`, `name_en`, `org_type`, `is_active`, `is_synthetic` | One `platform` org |
| `profiles` | `user_id` (pk → `auth.users`), `full_name`, `locale` (`ar`) | |
| `memberships` | `user_id`, `org_id`, `role` · unique(`user_id`,`org_id`) | Active org stored in a cookie, verified against this table |

### 3.2 Reference data (global, read-only for users)
| Table | Key columns | Notes |
|---|---|---|
| `delivery_zones` | `code` (unique, e.g. `Z-MCT`), `name_ar`, `name_en`, `cluster` | Synthetic labels |
| `products` | `sku` (unique), `name_ar`, `name_en`, `category`, `spec_key`, `attributes` jsonb, `unit`, `order_multiple`, `is_active` | `attributes` Zod-validated per category |
| `spec_equivalences` | `spec_key_a`, `spec_key_b`, `relation` (`equivalent`) | Drives `check_spec_compatibility` |
| `delivery_rate_cards` | `origin_zone_id`, `dest_zone_id`, `vehicle_type`, `capacity_units`, `trip_cost_baisa`, `per_stop_baisa`, `is_synthetic` | |

### 3.3 Organisation assets
| Table | Key columns | Notes |
|---|---|---|
| `locations` | `org_id`, `name_ar`, `kind`, `zone_id`, `address_ar` | Stores, plants, warehouses, sites |
| `supplier_offers` | `org_id` (seller), `product_id`, `dispatch_location_id`, `available_qty`, `moq`, `lead_time_days`, `price_tiers` jsonb `[{min_qty, unit_price_baisa}]`, `delivery_included`, `served_zone_ids` uuid[], `is_price_public`, `is_active`, `valid_until` | **Confidential prices** (§4) |
| `inventory_items` | `org_id`, `location_id`, `product_id`, `on_hand`, `on_order`, `reorder_point`, `safety_stock`, `avg_daily_usage` numeric, `target_cover_days` · unique(`location_id`,`product_id`) | `on_hand` changes **only** via `rpc_post_goods_receipt` or seed |
| `inventory_movements` | `org_id`, `inventory_item_id`, `movement_type`, `quantity` (signed), `reference_type`, `reference_id`, `created_by` | Append-only ledger |

### 3.4 Projects
| Table | Key columns | Notes |
|---|---|---|
| `projects` | `org_id`, `name_ar`, `site_location_id`, `status`, `start_date`, `end_date` | Contractor / project-owner orgs |
| `project_phases` | `project_id`, `org_id` (denormalised for RLS), `name_ar`, `sequence`, `status`, `start_date`, `end_date`, `approved_by`, `approved_at` | Only `approved`/`in_progress` phases feed Agent 6 actions |
| `phase_material_requirements` | `phase_id`, `project_id`, `org_id`, `product_id`, `quantity`, `needed_by`, `notes` | BOQ lines |

### 3.5 Demand & group purchasing
| Table | Key columns | Notes |
|---|---|---|
| `material_demands` | `buyer_org_id`, `location_id`, `product_id`, `quantity`, `required_by`, `status`, `source`, `pooling_consent` bool, `max_unit_price_baisa` (nullable, **confidential**), `project_id`, `phase_id`, `agent_run_id`, `rationale_ar`, `confirmed_by`, `confirmed_at` | H1 sets `confirmed`, consent and mandate |
| `purchase_groups` | `coordinator_org_id`, `product_id`, `status`, `total_quantity`, `window_start`, `window_end`, `zone_ids` uuid[], `proposal_run_id`, `discovery_run_id`, `awarded_quote_id`, `final_unit_price_baisa`, `approved_plan_id` | |
| `purchase_group_members` | `group_id`, `demand_id`, `buyer_org_id`, `quantity`, `status`, `unit_price_baisa`, `delivery_share_baisa`, `total_baisa`, `decided_by`, `decided_at` · **partial unique**(`demand_id`) where `status not in ('declined','withdrawn')` | Allocation lives here (no separate table) |

### 3.6 Sourcing & negotiation
| Table | Key columns | Notes |
|---|---|---|
| `rfqs` | `group_id`, `supplier_org_id`, `product_id`, `quantity`, `required_by_earliest`, `required_by_latest`, `zone_ids`, `status`, `response_deadline`, `sent_by`, `sent_at` | **Aggregated snapshot. No buyer identities.** |
| `quotes` | `rfq_id`, `group_id`, `supplier_org_id`, `revision`, `price_tiers` jsonb, `lead_time_days`, `delivery_included`, `dispatch_location_id`, `valid_until`, `notes`, `status`, `submitted_by`, `submitted_at` | A revision creates a new row; the previous one becomes `superseded` |
| `counteroffers` | `quote_id`, `group_id`, `supplier_org_id`, `round`, `proposed_unit_price_baisa`, `proposed_terms` jsonb, `message_to_supplier_ar`, `status`, `agent_run_id`, `approved_by/at` (H5), `responded_by/at` (H6), `response_note` | The internal rationale stays in `agent_runs.output` (platform-only), never on this row |

### 3.7 Orders & logistics
| Table | Key columns | Notes |
|---|---|---|
| `purchase_orders` | `po_number` (unique), `group_id`, `member_id`, `quote_id`, `buyer_org_id`, `supplier_org_id`, `status`, `subtotal_baisa`, `delivery_baisa`, `total_baisa`, `is_simulated` (default true), `issued_at`, `confirmed_by/at` | Buyer identity is revealed to the supplier from here on |
| `purchase_order_lines` | `po_id`, `product_id`, `quantity`, `unit_price_baisa`, `line_total_baisa` | |
| `delivery_plans` | `group_id`, `quote_id`, `status`, `total_delivery_cost_baisa`, `agent_run_id`, `approved_by/at` | From Agent 5 |
| `shipments` | `plan_id`, `group_id`, `supplier_org_id`, `vehicle_type`, `origin_location_id`, `scheduled_date`, `status`, `cost_baisa`, `is_simulated` (default true), `dispatched_at`, `delivered_at` | |
| `shipment_stops` | `shipment_id`, `member_id`, `po_id` (set at PO issue), `buyer_org_id`, `location_id`, `quantity`, `sequence`, `status`, `delivery_cost_share_baisa` | |
| `goods_receipts` | `stop_id`, `po_id`, `buyer_org_id`, `received_quantity`, `received_by`, `received_at`, `note` | H10 |

### 3.8 Governance & AI
| Table | Key columns | Notes |
|---|---|---|
| `approvals` | `gate`, `subject_type`, `subject_id`, `org_id`, `decided_by`, `decision`, `comment` | One row per human gate decision |
| `audit_events` | `actor_type`, `actor_user_id`, `actor_agent_run_id`, `org_id`, `entity_type`, `entity_id`, `action`, `from_state`, `to_state`, `payload` jsonb, `is_simulated` | Append-only |
| `agent_runs` | `agent_key`, `agent_version`, `instructions_hash`, `model`, `triggered_by`, `acting_org_id`, `subject_type`, `subject_id`, `status`, `input` jsonb, `output` jsonb, `error_code`, `error_message`, `guardrail_rejections` jsonb, `openai_response_ids` text[], `input_tokens`, `output_tokens`, `latency_ms`, `started_at`, `finished_at` | |
| `agent_tool_calls` | `run_id`, `sequence`, `tool_name`, `args` jsonb, `result` jsonb (≤ 8 KB), `status`, `duration_ms` | |

### 3.9 Relationship overview

```
organizations ─< memberships >─ auth.users ── profiles
organizations ─< locations >── delivery_zones
organizations ─< supplier_offers >── products ─< spec_equivalences (by spec_key)
organizations ─< inventory_items ─< inventory_movements
organizations ─< projects ─< project_phases ─< phase_material_requirements >── products
organizations ─< material_demands >── products, locations, (projects, phases), agent_runs
purchase_groups ─< purchase_group_members >── material_demands
purchase_groups ─< rfqs ─< quotes ─< counteroffers
purchase_groups ─< delivery_plans ─< shipments ─< shipment_stops >── purchase_orders
purchase_groups ─< purchase_orders ─< purchase_order_lines
shipment_stops ─< goods_receipts ──► inventory_movements (via RPC)
agent_runs ─< agent_tool_calls        approvals / audit_events → any entity (polymorphic)
```

### 3.10 State machines (implemented as pure TS in `src/domain/state-machines`; mirrored by RPC preconditions)

| Entity | Legal transitions |
|---|---|
| demand | `draft→confirmed` (H1) · `draft→cancelled` · `confirmed→grouped` (H2) · `grouped→confirmed` (member declined/withdrawn) · `grouped→ordered` (PO) · `ordered→fulfilled` (H10 full qty) · `confirmed→cancelled` |
| group | as Doc 2 §5.1; `* → cancelled` allowed before `po_issued` |
| member | `proposed→active` (H2) · `active→allocated` (H7) · `allocated→approved|declined` (H8) · `active|allocated→withdrawn` |
| rfq | `sent→quoted` (H4) · `sent→declined|expired` · `quoted→closed` (award) |
| quote | `submitted→superseded` (revision) · `submitted→awarded|not_awarded` (H7) · `submitted→withdrawn` |
| counteroffer | `draft→sent` (H5) · `draft→discarded` · `sent→accepted|rejected|countered` (H6) |
| plan | `proposed→approved` (H7) · `proposed→superseded` |
| purchase order | `issued→confirmed` (H9) · `confirmed→fulfilled` (all stops received) · `issued→cancelled` |
| shipment | `planned→scheduled` (H9) · `scheduled→dispatched` (sim) · `dispatched→delivered` (sim) · `*→cancelled` before dispatch |
| stop | `pending→delivered` (shipment delivered) · `delivered→received` (H10) |

**Award price rule (deterministic):** if the latest counteroffer on the awarded quote is `accepted`, use its price; otherwise use the quote's tier price at the group quantity. **H8 decline rule:** recompute the group quantity; if the awarded tier's `min_qty` still holds, keep the price and proceed with the remaining members; otherwise the group moves to `requote_required`.

---

## 4. RLS read-policy matrix

`own` = row's org ∈ `app.my_org_ids()`. `platform` = `app.is_platform()`.

| Table | Who can SELECT |
|---|---|
| organizations | own; platform; any authenticated user for `name_ar`/`org_type` of **counterparties** they hold a PO with (via a policy subquery) |
| profiles | self; members of the same org |
| memberships | own org's memberships |
| delivery_zones, products, spec_equivalences, delivery_rate_cards | all authenticated |
| locations | own; platform; supplier for locations on its shipment stops (after PO) |
| supplier_offers | own (seller); platform. Buyers get **no direct access**; aggregate lead times come through the `rpc_product_lead_time_stats` read function (no prices); public-price search (S2) through `rpc_search_public_offers` |
| inventory_items, inventory_movements | own |
| projects, project_phases, phase_material_requirements | own |
| material_demands | own (buyer); platform **only where `pooling_consent = true` and status ≠ `draft`** |
| purchase_groups | platform; buyers whose org has a member row in the group |
| purchase_group_members | platform; buyer for **own** member rows only |
| rfqs | platform; addressed supplier |
| quotes | platform; the authoring supplier. **Never buyers, never other suppliers** |
| counteroffers | platform; addressed supplier only when status ∉ (`draft`, `discarded`) |
| purchase_orders, purchase_order_lines | buyer; supplier; platform |
| delivery_plans | platform |
| shipments, shipment_stops | platform; supplier (own); buyer for stops where `buyer_org_id` is own (and the parent shipment) |
| goods_receipts | buyer; supplier of the PO; platform |
| approvals, audit_events | platform; rows where `org_id` is own |
| agent_runs, agent_tool_calls | platform; runs where `acting_org_id` is own |

Read-only security-definer functions used by agent tools to expose **aggregates without confidential fields**:
- `rpc_product_lead_time_stats(product_id)` → min/median lead time (no prices, no supplier names)
- `rpc_group_mandate_ceiling(group_id)` → `min(max_unit_price_baisa)` over active members (platform only)
- `rpc_search_public_offers(spec_key, zone_ids)` → offers with `is_price_public = true` (S2)

---

## 5. Atomic write RPCs (service-role only; logic = precondition check + inserts/updates + audit)

| RPC | Called after | Does atomically |
|---|---|---|
| `rpc_confirm_demand` | H1 | demand → confirmed; consent, mandate, required_by; approval + audit |
| `rpc_create_proposed_groups` | Agent 3 + guardrails | groups + members (proposed), linking `proposal_run_id` |
| `rpc_approve_group` | H2 | group → approved; members → active; demands → grouped |
| `rpc_dispatch_rfqs` | H3 | rfq rows (aggregated snapshot); group → rfq_sent |
| `rpc_submit_quote` | H4 | quote (new revision; supersede the previous one); rfq → quoted; group → quoting |
| `rpc_create_counteroffers` | Agent 4 + guardrails | draft counteroffers; group → negotiating |
| `rpc_send_counteroffer` / `rpc_respond_counteroffer` | H5 / H6 | status changes; on `countered` → new quote revision |
| `rpc_save_delivery_plan` | Agent 5 + guardrails | plan + planned shipments/stops |
| `rpc_award_group` | H7 | award quote; other quotes not_awarded; approve plan; member allocations (from TS domain) |
| `rpc_decide_allocation` | H8 | member approved/declined; when all decided → POs + lines, stops linked to POs; group → po_issued, or requote_required |
| `rpc_confirm_po` | H9 | PO confirmed; shipments → scheduled; when all confirmed, group → in_delivery |
| `rpc_simulate_shipment` | sim action | dispatched / delivered (+ stops delivered); `is_simulated` audit |
| `rpc_post_goods_receipt` | H10 | receipt; movement (+qty); `inventory_items.on_hand += qty`; stop received; PO/demand fulfilled; group completed when all received |

---

## 6. Integration points

| System | Purpose | Interface | MVP status |
|---|---|---|---|
| Supabase Auth | Sessions, users | Supabase SSR helpers (cookie sessions) + `auth.admin` in seed | Live |
| Supabase Postgres | Data, RLS, RPCs | `supabase-js` (PostgREST + `rpc()`); generated TS types | Live |
| OpenAI | Six agents | Responses API, function calling, structured outputs (official Node SDK) | Live |
| Vercel | Hosting, env, logs | Git integration; preview + production | Live |
| GitHub | Source, PR history; optional CI (typecheck, lint, test) | Actions | Live |
| Supabase CLI | Migrations, type generation | `supabase db push`, `supabase gen types` | Dev-time |
| Payments, e-signature, SMS/WhatsApp/email, maps/GPS, ERP | — | — | **Excluded** (Doc 4 §3) |

---

## 7. Environment variables

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | ✓ | Publishable (or legacy anon) key for user-scoped, RLS-enforced access. Confirm the current key naming in Stage 1 |
| `SUPABASE_SECRET_KEY` | **server only** | ✓ | Secret (or legacy service-role) key for the admin client and seed |
| `OPENAI_API_KEY` | **server only** | ✓ | Agent inference |
| `OPENAI_MODEL` | server | ✓ | Default agent model (chosen in Stage 1) |
| `OPENAI_REASONING_EFFORT` | server | – | Only if the chosen model supports it |
| `OPENAI_TIMEOUT_MS` | server | – | Default 60000 |
| `OPENAI_STORE_RESPONSES` | server | – | Default `false` |
| `AGENT_MAX_TOOL_ITERATIONS` | server | – | Default 8 |
| `NEGOTIATION_MAX_ASK_PCT` | server | – | Default 0.10 |
| `NEXT_PUBLIC_APP_URL` | public | ✓ | Absolute URLs |
| `NEXT_PUBLIC_BRAND_NAME_AR` / `NEXT_PUBLIC_BRAND_NAME_EN` | public | – | Optional overrides of `src/config/brand.ts` |
| `DEMO_MODE` | server | ✓ | `true` enables persona login, simulation actions and the banner |
| `NEXT_PUBLIC_DEMO_MODE` | public | ✓ | Mirrors `DEMO_MODE` for the UI banner only (no security meaning) |
| `DEMO_USER_PASSWORD` | **server only** | demo | Seeded persona password; used by seed + demo login route |
| `SUPABASE_DB_URL` | local only | dev | CLI / migrations (never in Vercel runtime) |

All variables are validated at boot by `src/env.ts` (Zod). Server-only variables live in a module that imports `server-only`. A committed `.env.example` lists names only.

---

## 8. Seed & reset strategy

- `scripts/seed.ts` (run with the admin client): **idempotent upserts** by natural keys (`organizations.slug`, `products.sku`, `delivery_zones.code`, persona email). It creates auth users via `auth.admin`. Dates are relative to "today" so the scenario never goes stale.
- Every seeded org name ends with "— تجريبي" and has `is_synthetic = true`. Rate cards and offers have `is_synthetic = true`.
- `scripts/reset-demo.ts`: deletes transactional rows (demands → receipts, runs, audit), then re-seeds inventory and projects to the Doc 4 §5.1 state. Refuses to run unless `DEMO_MODE=true`.

## 9. Planned migration sequence (to be written in Stage 3, not now)

1. `enums_tenancy_helpers` — enums, organizations, profiles, memberships, `app.*` helper functions, RLS
2. `reference_catalog` — zones, products, spec_equivalences, rate cards, RLS
3. `org_assets` — locations, supplier_offers, inventory, movements, projects, phases, BOQ, RLS
4. `demand_groups` — demands, groups, members, RLS
5. `sourcing` — rfqs, quotes, counteroffers, RLS
6. `orders_logistics` — POs, lines, plans, shipments, stops, receipts, RLS
7. `governance_ai` — approvals, audit_events, agent_runs, agent_tool_calls, RLS
8. `rpc_read_functions` — the read-only aggregate functions of §4

The **atomic write RPCs of §5 are added by the feature stage that first needs them** (Doc 6), each in its own new migration with `REVOKE EXECUTE … FROM anon, authenticated`. Each migration enables RLS on every table it creates (Doc 7 §4).
