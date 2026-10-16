# Document 1 — Master Product Brief

> **Codename:** Construction Supply AI (temporary; final brand TBD — see `brand` config, Doc 7 §6)
> **Market:** Sultanate of Oman first; GCC expansion later
> **Status:** Phase 0 foundation — approved spec required before implementation
> **Data policy:** This document contains no market statistics, savings claims, or traction figures. None have been verified.

---

## 1. One-line definition

An Arabic-first, multi-tenant **procurement and supply-chain operating platform** for construction materials, in which six specialised AI agents prepare demand, sourcing, aggregation, negotiation, logistics and project-planning proposals — and humans approve every commercial commitment.

What it is **not**:

| Not this | Why the distinction matters |
|---|---|
| An online marketplace | We coordinate procurement workflows (demand → RFQ → negotiation → PO → delivery → receipt), not just listings and checkout. |
| A chatbot | Agents produce structured, validated proposals stored as database records, not chat replies. |
| A price-comparison site | Comparison is one step inside a full workflow that ends in purchase orders and inventory updates. |

---

## 2. The problem

Construction-material procurement involves many disconnected parties:

- **Retailers** manage inventory and replenishment on their own, buying in small lots.
- **Manufacturers and distributors** receive fragmented, irregular purchase requests that are hard to plan production and dispatch around.
- **Contractors** search, negotiate and coordinate deliveries themselves, project by project.
- **Project owners and homebuilders** struggle to compare suitable suppliers, specifications and **total delivered cost**.

Weak procurement planning, fragmented coordination, hard-to-reach suppliers and late deliveries all contribute to cost overruns and project disruption. Nobody in the chain sees the combined demand, so nobody can act on it.

---

## 3. The solution

One shared ecosystem where every participant works through their own organisation account, and where AI agents do the analysis and preparation work while humans keep authority.

### 3.1 Factory-to-retailer operations (supply side)
1. Manufacturers and distributors register products, specifications, available supply, lead times and service zones.
2. Retailers keep their inventory on the platform; the **Needs & Inventory Agent** proposes replenishment demands.
3. The **Group Procurement Agent** finds compatible demands across retailers (and contractors) who have explicitly consented to pooling.
4. The **Supplier Discovery Agent** shortlists qualified suppliers, and the platform issues **internal RFQs** to their accounts.
5. Suppliers quote through their own interface. The **Negotiation Agent** analyses the quotes and drafts counteroffers inside buyer-approved limits.
6. Each buyer approves their own allocation, and purchase orders are generated.
7. The **Logistics Agent** plans deliveries. Inventory is updated **only after the buyer confirms receipt**.

### 3.2 Retailer-to-customer operations (demand side)
1. Contractors and project owners request materials, either as free text or from project schedules.
2. The platform matches the request to catalogue specifications and to sellers (retailers, distributors or manufacturers, depending on quantity and conditions).
3. Specifications, delivery conditions and total delivered cost are compared deterministically.

### 3.3 Intelligent supply-chain coordination
- Inventory analysis, project-schedule analysis and forward procurement recommendations (**Project Intelligence Agent**)
- Demand aggregation, RFQ preparation, negotiation support and delivery planning
- A full audit trail of every human decision and every agent run

---

## 4. Target users and personas

| Org type | Persona | Primary jobs on the platform |
|---|---|---|
| `manufacturer` | Factory sales / dispatch manager | Publish products and capacity; answer RFQs; respond to counteroffers; confirm POs; dispatch |
| `distributor` | Distributor sales manager | Same as manufacturer, often with stock across several locations |
| `retailer` | Building-material store owner / purchaser | Maintain inventory; review replenishment proposals; join group purchases; approve allocations; confirm receipt |
| `contractor` | Procurement officer / site engineer | Manage projects and phases; request materials; approve purchases; confirm site receipt |
| `project_owner` | Individual homebuilder | Request materials for one project; compare delivered cost; approve and receive |
| `platform` | Platform procurement coordinator (operations team) | Run aggregation, discovery, negotiation and logistics agents; approve RFQ dispatch, counteroffers and award recommendations |

Inside every organisation, users hold one of these roles: `admin`, `approver`, `member` or `viewer` (Doc 2 §6).

---

## 5. Operational model

1. **The platform coordinates; participants decide.** The platform's coordinator team runs the cross-organisation agents (aggregation, discovery, negotiation, logistics). Buyers and suppliers make every commercial decision for their own organisation.
2. **Agents propose; the deterministic controller validates; humans approve.** No agent writes commercial state directly (Doc 2 §4).
3. **Pooling requires explicit consent.** A demand joins a group purchase only if its buyer ticked "allow pooling" when confirming it.
4. **Confidentiality by default.**
   - Suppliers never see competitors' quotes.
   - Suppliers see aggregated demand (specification, quantity, delivery zones, time window). They do not see buyer identities until a PO is issued.
   - Buyers see their own allocation price. They do not see raw competing quotes.
   - Buyer price ceilings ("mandates") are visible only to that buyer and the platform coordinator.
5. **Simulation is labelled.** In the MVP, external factories, payments and physical deliveries are simulated, and every simulated element carries a visible "محاكاة / Simulated" label.

---

## 6. Core features (product level)

| # | Area | Feature |
|---|---|---|
| F1 | Identity | Organisation accounts, user membership, role-based access, tenant isolation |
| F2 | Catalogue | Canonical product specifications (e.g. cement type, strength class, pack size) |
| F3 | Supply | Supplier offers: capacity, MOQ, price tiers (confidential), lead time, service zones |
| F4 | Inventory | Retailer stock, reorder points, movement ledger, receipt-driven updates |
| F5 | Projects | Contractor projects, phases, approved schedules, phase material requirements (BOQ) |
| F6 | Demand | Draft and confirmed material demands with source, consent and optional price mandate |
| F7 | Group purchasing | Agent-proposed, coordinator-approved purchase groups with per-buyer allocations |
| F8 | RFQ & quotes | Internal RFQs to registered suppliers; supplier quote submission UI |
| F9 | Negotiation | Agent-drafted, human-approved counteroffers; supplier accept/reject/revise |
| F10 | Award & PO | Deterministic ranking, coordinator award approval, buyer allocation approval, PO generation |
| F11 | Logistics | Agent-proposed delivery plans, shared-cost allocation, shipment tracking (simulated) |
| F12 | Receipt | Buyer goods-receipt confirmation, which posts the inventory movement |
| F13 | Agent monitoring | Every run: input, tool calls, output, tokens, latency, errors |
| F14 | Audit | Append-only log of human decisions and state transitions |

---

## 7. Business value (qualitative; not yet validated)

| Participant | Intended value |
|---|---|
| Retailers | Access to volume pricing they cannot get alone; less manual replenishment work; receipt-accurate inventory |
| Manufacturers / distributors | Consolidated, better-specified demand; fewer fragmented requests; clearer delivery planning |
| Contractors | Procurement linked to the project schedule; comparable delivered-cost options; fewer surprises on site |
| Project owners | Easier comparison of suitable materials and total delivered cost |
| The ecosystem | Shared visibility of demand and supply, with a traceable decision record |

**Revenue hypotheses (unvalidated, for discussion only):** a coordination fee on aggregated orders, SaaS subscriptions for suppliers and retailers, and logistics-coordination fees. None of these is part of the MVP.

---

## 8. MVP success definition (hackathon)

The MVP succeeds if a judge can watch, in one session and on real database records with real OpenAI calls, the full **500-bag cement scenario**:

> Retailer A (100) + Retailer B (150) + Contractor C (250) → Agent-proposed group of 500 → supplier discovery → internal RFQs → supplier quotes (via supplier UI) → agent counteroffers (coordinator-approved) → supplier responses → award → per-buyer approval → 3 POs → delivery plan → simulated dispatch → receipt confirmation → retailer inventory updated → complete audit and agent logs.

The scenario is specified exactly in Doc 4 §5.

---

## 9. Glossary (canonical Arabic UI terms)

UI copy must use these terms consistently. They live in the i18n dictionary (Doc 7 §6).

| English | Arabic (UI) | Meaning |
|---|---|---|
| Organisation | المنشأة | Tenant account |
| Manufacturer / Factory | المصنع | Producer of materials |
| Distributor | الموزّع | Wholesale intermediary |
| Retailer | متجر مواد البناء | Building-material store |
| Contractor | المقاول | Construction company |
| Project owner | مالك المشروع | Individual homebuilder |
| Coordinator | منسّق المشتريات | Platform operations user |
| Material demand | طلب مواد | Need for a product and quantity by a date |
| Replenishment | إعادة التموين | Restocking inventory |
| Pooling consent | الموافقة على الشراء الجماعي | Opt-in to aggregation |
| Group purchase | الشراء الجماعي | Aggregated buying event |
| RFQ | طلب عرض سعر | Request for quotation |
| Quote | عرض سعر | Supplier's priced response |
| Counteroffer | عرض مضاد | Proposed revised terms |
| Price mandate | الحد الأعلى للسعر | Buyer's maximum acceptable unit price |
| Award | الترسية | Selection of the winning offer |
| Allocation | الحصة | A buyer's share of a group purchase |
| Purchase order (PO) | أمر شراء | Commercial order document |
| Delivery plan | خطة التوصيل | Proposed shipments and stops |
| Shipment | الشحنة | One vehicle trip |
| Goods receipt | تأكيد الاستلام | Buyer's confirmation of received quantity |
| Landed / delivered cost | التكلفة الإجمالية شاملة التوصيل | Material + delivery cost |
| Bill of quantities (BOQ) | جدول الكميات | Phase material requirements |
| Lead time | مدة التوريد | Days from order to dispatch availability |
| MOQ | الحد الأدنى للطلب | Minimum order quantity |
| Simulated | محاكاة | Not a real-world action |
| Synthetic data | بيانات تجريبية | Demo-only records |
| Agent run | تشغيل الوكيل | One execution of an AI agent |

---

## 10. Non-goals (all phases until explicitly re-scoped)

- Real payments, credit, escrow or invoicing
- Legally binding e-contracts or e-signatures
- Contacting real, non-registered suppliers (email, SMS, WhatsApp or scraping)
- Real fleet telematics or third-party logistics APIs
- More than six AI agents, or a "master" AI orchestrator
