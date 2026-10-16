# Document 4 — MVP Scope (12-Hour Hackathon)

> Priority keys: **M** = mandatory (the demo fails without it), **S** = optional (only after every M item passes acceptance), **X** = excluded from the 12-hour build.

---

## 1. Mandatory functions (M)

| ID | Function | Platform area (brief §6) | Acceptance summary |
|---|---|---|---|
| M1 | Supabase Auth login; organisations, memberships, roles; active-org context | 9 | Each seeded persona logs in and lands on the home page for their org type |
| M2 | RLS on every table; tenant-isolation test script | 9 | Isolation script passes (§6) |
| M3 | Demo persona quick-login (server-side, `DEMO_MODE` only) | 9 | One click per persona; no credential in client bundle |
| M4 | Arabic RTL app shell, brand config, global "بيانات تجريبية" banner, role-aware navigation | all | `dir="rtl"`; changing the brand config renames the app everywhere |
| M5 | Seeded catalogue, supplier offers, zones, rate cards, inventory, project (synthetic, labelled) | 2–4 | Seed is idempotent; every seeded org name carries "تجريبي" |
| M6 | Retailer inventory table + **Agent 1** replenishment run → draft demands | 3 | Retailers A and B get proposals of 100 and 150 from the live agent |
| M7 | Contractor project/phases view + **Agent 6** run → draft demand | 4 | Contractor C gets a 250-bag recommendation for the approved phase |
| M8 | Contractor free-text material request → **Agent 1** request mode → draft demand lines | 4 | "أحتاج 250 كيس إسمنت بورتلاندي 42.5" maps to the catalogue product |
| M9 | Demand confirmation **H1** with pooling consent + optional price mandate | 3, 4 | Only confirmed + consented demands are poolable |
| M10 | Group purchasing workspace + **Agent 3** → proposed group; **H2** approval | 6 | 500-bag group with 3 members, validated by guardrails |
| M11 | **Agent 2** discovery on group → shortlist; **H3** RFQ dispatch | 6, 5 | RFQs exist only for coordinator-selected suppliers |
| M12 | Supplier dashboard: RFQ inbox (aggregated, buyer-anonymous) + quote submission **H4** | 2 | Supplier sees qty, spec, zones and window; no buyer names; cannot see other quotes |
| M13 | Negotiation workspace + **Agent 4** analysis/counteroffers; **H5** send; supplier response **H6** | 5 | Accepted status exists only after a supplier user's action |
| M14 | **Agent 5** delivery plan + deterministic cost shares; **H7** award → allocations | 7, 6 | Allocations sum exactly to the group total (qty and baisa) |
| M15 | Buyer allocation approval **H8** → PO generation; supplier PO confirmation **H9** | 3, 4, 2, 7 | 3 POs (100/150/250), marked "no payment — simulated" |
| M16 | Shipments with simulated dispatch/delivery; buyer receipt **H10** → inventory movement | 7, 3 | Retailer stock changes only after H10, by exactly the received quantity |
| M17 | Agent monitoring: runs list + run detail (input, tool calls, output, tokens, latency, errors, guardrail rejections) | 8 | All six agent keys appear with real OpenAI response IDs |
| M18 | Main operational dashboard: groups by state, pending gates, recent agent runs, failures | 1 | Numbers come from DB queries, not constants |
| M19 | Per-group timeline from `audit_events` + `approvals` | 6, 8 | Every gate and transition is visible in order |
| M20 | Deterministic domain library + unit tests (money, reorder, compatibility, tiers, landed cost, delivery cost, allocation, state machines) | — | `npm test` green; covers the scenario numbers in §5 |
| M21 | Production deploy on Vercel + hosted Supabase | — | Public URL runs the full scenario |

## 2. Optional functions (S) — only after all M items pass

| ID | Function | Note |
|---|---|---|
| S1 | "Reset demo data" admin action (`DEMO_MODE` only) | High value for rehearsals; the CLI seed is the fallback |
| S2 | Section B direct-sourcing comparison: Agent 2 on a single contractor demand using public prices | Reuses Agent 2; no new agent |
| S3 | Decline path UI at H8 (domain logic and tests for `requote_required` are already M20) | |
| S4 | Supplier offer create/edit UI | Seed covers MVP |
| S5 | Inventory edit UI | Seed covers MVP |
| S6 | Negotiation round 2 (round ≤ 3 already supported by the schema) | |
| S7 | Supabase Realtime for run status | Polling is the M fallback |
| S8 | Per-user rate limit on agent endpoints (DB-count based) | |
| S9 | Playwright smoke test of the scenario | API-level E2E script is M |
| S10 | English UI toggle | The dictionary already supports it |
| S11 | Org member management UI | |

## 3. Excluded from the 12-hour build (X)

| Excluded | Reason / substitute |
|---|---|
| Real payments, invoicing, credit, escrow | POs are marked "simulated — no payment" |
| E-signatures, legally binding contracts | Approvals are recorded platform actions only |
| Contacting real suppliers (email, SMS, WhatsApp, scraping) | Internal RFQs to registered (seeded) accounts only |
| Real fleet tracking, GPS, maps, 3PL APIs | Simulated shipment status buttons |
| ERP / POS integrations, CSV import | Seeded data |
| Self-service org sign-up, KYC, CR verification | Seeded orgs and users |
| VAT / tax calculation, multi-currency | Prices shown as "excl. VAT, not calculated"; OMR only |
| Email / push notifications | In-app "pending actions" lists |
| File uploads (drawings, BOQ PDFs, OCR) | BOQ seeded as structured lines |
| Price forecasting / ML models | Out of scope |
| Ratings, reviews, chat between parties | Out of scope |
| Autonomous multi-round negotiation | Every counteroffer requires H5 |
| Any seventh agent (router, supervisor, chat assistant) | Forbidden by spec |

---

## 4. Personas seeded for the demo (all synthetic)

| Persona key | Org (Arabic display) | Org type | Role | Location / zone |
|---|---|---|---|---|
| `coordinator` | فريق تنسيق المنصة — تجريبي | platform | approver | — |
| `factory_a` | مصنع الإسمنت (أ) — تجريبي | manufacturer | approver | Z-NBA |
| `factory_b` | مصنع الإسمنت (ب) — تجريبي | manufacturer | approver | Z-DAK |
| `distributor_c` | موزّع مواد البناء (ج) — تجريبي | distributor | approver | Z-MCT |
| `retailer_a` | متجر مواد البناء (أ) — تجريبي | retailer | approver | Z-MCT |
| `retailer_b` | متجر مواد البناء (ب) — تجريبي | retailer | approver | Z-SBA |
| `contractor_c` | شركة المقاولات (ج) — تجريبي | contractor | approver | Z-MCT (site) |

Zones are synthetic labels for Muscat (`Z-MCT`), South Al Batinah (`Z-SBA`), North Al Batinah (`Z-NBA`) and Ad Dakhiliyah (`Z-DAK`), all in one delivery cluster (`capital_batinah`), with `Z-DAK` adjacent.

---

## 5. Central demonstration scenario — exact specification

**All values below are SYNTHETIC test fixtures, not market prices.**

### 5.1 Seed state

Product `P-OPC425-50`: Ordinary Portland Cement, strength class 42.5N, 50 kg bag. `spec_key = cement.opc.42_5n.bag50`, unit `bag`, order multiple 10.

| Retailer | on_hand | on_order | reorder_point | avg_daily_usage | target_cover_days | safety_stock | Expected Agent 1 qty |
|---|---|---|---|---|---|---|---|
| A | 50 | 0 | 60 | 6 | 21 | 24 | 6×21 + 24 − 50 = **100** |
| B | 20 | 0 | 50 | 10 | 14 | 30 | 10×14 + 30 − 20 = **150** |

Contractor C — project "فيلا سكنية (ج) — تجريبي", phase "الأساسات" (status `approved`, starts at today + 18). BOQ line: `P-OPC425-50` × **250**, needed_by = phase start. Lead time used is 4 days and the buffer 3 days, so order_by = today + 11 and pooling is suggested.

Required-by dates confirmed at H1 (buyers may adjust the agent's suggested date): A = today + 12, B = today + 14, C = today + 18. The required-by spread is 6 days (≤ 21-day window), and the earliest date is ≥ today + max supplier lead time (6), so the group is compatible and all three suppliers are lead-time feasible.

Supplier offers (indicative; the real numbers are entered as quotes by supplier users at H4):

| Supplier | Price tiers (baisa / bag) | Lead time | Capacity | MOQ | Delivery |
|---|---|---|---|---|---|
| Factory A (Z-NBA) | 1–299: 1900 · 300–999: 1780 · 1000+: 1700 | 4 d | 5000 | 100 | not included |
| Factory B (Z-DAK) | 1–499: 1850 · 500+: 1760 | 6 d | 2000 | 200 | not included |
| Distributor C (Z-MCT) | any: 1950 | 1 d | 800 | 10 | included (Z-MCT, Z-SBA) |

Rate cards (truck, capacity 600 bags): Z-NBA→Z-MCT 45.000 OMR, Z-NBA→Z-SBA 35.000, Z-DAK→Z-MCT 55.000, Z-DAK→Z-SBA 50.000; each extra stop 5.000.
Shipment cost rule = `max(trip_cost(origin, stop_zone) for stops) + per_stop × (stops − 1)`.

Mandates at H1: Retailer B sets a ceiling of 1800 baisa per bag. A and C set none. The group ceiling is therefore 1800.

**Decoy demands (pre-seeded as `confirmed`) to prove the guardrails work:**
- Retailer B — concrete blocks 20 cm × 400, `pooling_consent = false` → must never appear in `list_poolable_demands`.
- Contractor C — OPC 52.5R × 100 bags, consent ✓, no compatible partner → Agent 3 must list it under `ungrouped_demands` with a reason.

### 5.2 Demo script (target 8–10 minutes)

| Step | Persona | Action | Expected result |
|---|---|---|---|
| 1 | retailer_a | Analyse inventory (Agent 1) | Draft demand: 100 bags, rationale in Arabic, run visible in `/agents` |
| 2 | retailer_a | Confirm demand, pooling ✓ (H1) | Status `confirmed` |
| 3 | retailer_b | Agent 1 → confirm with consent + mandate 1.800 (H1) | 150 bags, `confirmed` |
| 4 | contractor_c | Analyse project (Agent 6) → confirm, pooling ✓ (H1) | 250 bags, order-by date shown, `confirmed` |
| 5 | coordinator | Find group opportunities (Agent 3) → approve (H2) | Group of **500**, 3 members, `approved` |
| 6 | coordinator | Discover suppliers (Agent 2) → select A, B, C → send RFQs (H3) | 3 RFQs; group `rfq_sent` |
| 7 | factory_a / factory_b / distributor_c | Open RFQ inbox, submit quotes (H4) | Expected entries: A 1780, B 1760, C 1950 (delivered) |
| 8 | coordinator | Analyse & draft counteroffers (Agent 4) → approve chosen ones (H5) | Draft counteroffers within policy bounds, messages pass the leak filter |
| 9 | factory_a | Respond to counteroffer: accept (or revise) (H6) | Acceptance recorded with supplier user ID and time |
| 10 | coordinator | Plan delivery (Agent 5) → approve award (H7) | Plan + cost shares; allocations 100/150/250 |
| 11 | retailer_a, retailer_b, contractor_c | Approve own allocation (H8) | 3 POs generated after all approvals |
| 12 | factory_a | Confirm POs (H9) → simulate dispatch | Shipments `dispatched` (labelled محاكاة) |
| 13 | factory_a | Simulate delivery | Shipments `delivered` |
| 14 | retailer_a | Confirm receipt of 100 (H10) | Inventory 50 → **150**; movement row created |
| 15 | coordinator | Open dashboard, group timeline, `/agents` | Full trace: 6 agents, 10 gates, all transitions |

### 5.3 Reference arithmetic (for unit tests; assumes final price 1730 baisa and one 3-stop truck from Factory A)

| Buyer | Qty | Material (baisa) | Delivery share (baisa) | Total (baisa) | Total (OMR) |
|---|---|---|---|---|---|
| Retailer A | 100 | 173,000 | 11,000 | 184,000 | 184.000 |
| Retailer B | 150 | 259,500 | 16,500 | 276,000 | 276.000 |
| Contractor C | 250 | 432,500 | 27,500 | 460,000 | 460.000 |
| **Group** | **500** | **865,000** | **55,000** (45,000 + 2×5,000) | **920,000** | **920.000** |

The dashboard may show a "difference vs single-buyer purchase *on synthetic data*". It must never be labelled as real or verified savings.

---

## 6. MVP-level acceptance tests

| ID | Test | Method |
|---|---|---|
| AT-1 | Tenant isolation: retailer_a cannot read retailer_b inventory, demands or mandates; a supplier cannot read another supplier's quotes; a supplier cannot see buyer org IDs or names in RFQs before a PO | Script signing in as each persona via the user client and asserting row counts |
| AT-2 | Domain arithmetic of §5.1 and §5.3 | Vitest |
| AT-3 | Illegal transitions are rejected (e.g. award before any acceptance; PO before H8; receipt before delivery) | Vitest on state machines + API test |
| AT-4 | Agent safety: no agent run produces a DB write; acceptance cannot originate from Agent 4 | Runtime allowlist test + absence of write tools + guardrail test |
| AT-5 | Live agents: each of the six runs once successfully on seed data | `agents:smoke` script (real API) |
| AT-6 | Full scenario E2E: steps 1–15 via API as personas; assertions on POs, inventory, audit and run counts | `e2e:scenario` script |
| AT-7 | Inventory changes only on H10 | Assert stock unchanged after PO, dispatch and delivery; changed only after receipt |
| AT-8 | RTL/Arabic: every page renders `dir=rtl` with no untranslated keys | Dictionary key check + manual review |
| AT-9 | Production URL runs AT-6 against the hosted Supabase | Manual run before the demo |

## 7. Cut-line (if behind schedule)

Cut in this order, and only as far as needed:
1. All S items.
2. M18 dashboard reduced to counts plus a pending-gates list.
3. M19 timeline reduced to a plain chronological table.
4. M8 free-text request (keep the Agent 1 replenishment path; the agent's request mode stays implemented and tested).

**Never cut**: the six live agents, gates H1–H10, RLS isolation, receipt-driven inventory, agent run logging, the labelling of simulated and synthetic data.
