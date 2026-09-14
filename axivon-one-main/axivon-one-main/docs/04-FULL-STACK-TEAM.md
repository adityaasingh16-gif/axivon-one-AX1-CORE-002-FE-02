# 04-FULL-STACK-TEAM.md

## 1. Document Information

| Field | Value |
|---|---|
| Project Name | AXIVON ONE — Modular Business & Management Platform |
| Team Name | Full-Stack Development Team |
| Document Purpose | Defines mission, scope, and standards for the Full-Stack team |
| Document Version | 1.0 |
| Status | Draft — Living Document |
| Owner | Full-Stack Lead |
| Audience | Full-Stack Developers, Frontend Team, Backend Team, UI/UX Team, Engineering Leadership |
| Last Updated | TBD — set on first commit to repository |
| Related Teams | UI/UX Team, Frontend Team, Backend Team |

---

## 2. Team Mission

The Full-Stack Team owns **complete, end-to-end delivery of complex, cross-cutting features** that don't cleanly belong to only Frontend or only Backend — and ensures the pieces built by every team actually integrate into a production-ready whole.

**What the team owns:** End-to-end feature ownership for complex/cross-cutting modules, integration work spanning frontend and backend, admin/internal tooling, third-party integrations requiring both layers, end-to-end testing, and production readiness support.

**What the team does not own:** The design system (UI/UX owns it), the core reusable frontend component library (Frontend owns it), the core API/database architecture (Backend owns it). Full-Stack builds *on top of* these foundations — it does not duplicate them.

**Why this matters:** Some features (e.g., a Billing module that must generate invoices, apply business rules, integrate a payment provider, and render a polished UI) genuinely span both layers tightly enough that splitting them across two teams causes handoff friction and duplicated context. Full-Stack exists to own these end-to-end, without becoming a shadow team that rebuilds what Frontend/Backend already provide.

**Contribution to reusable client projects:** Full-Stack ensures complex modules (Billing, Reporting, Industry modules) are delivered as complete, reusable units — integrated, tested, and production-ready — rather than half-finished pieces requiring last-minute glue work per client.

---

## 3. Team Structure

| Role | Core Responsibility | Can Be Combined With |
|---|---|---|
| Full-Stack Lead | Feature architecture, cross-team coordination, technical direction | Senior Full-Stack Developer |
| Full-Stack Developer | End-to-end feature implementation | — |
| Module Owner | Accountable for a specific complex module end-to-end | Full-Stack Developer |
| Integration Developer | Third-party/cross-team integration work | Full-Stack Developer |
| Technical Support Developer | Cross-team support, debugging, production issue response | Full-Stack Developer (rotated) |

In a small team, the Full-Stack Lead may also act as Module Owner for the first complex feature; support/integration responsibilities can rotate.

---

## 4. Responsibility Matrix

| Area | Primary Owner | Supporting Team | Responsibility |
|---|---|---|---|
| Requirements | Product | Full-Stack (feasibility for complex features) | Understand end-to-end scope |
| UX | UI/UX | Full-Stack (informed) | Not owned here |
| UI | UI/UX | Full-Stack (implements for owned modules) | Implementation for complex modules only |
| Design System | UI/UX | Full-Stack (consumes, does not modify) | Uses existing system |
| Frontend | Frontend | Full-Stack (for owned complex modules) | Shared, feature-scoped |
| Backend | Backend | Full-Stack (for owned complex modules) | Shared, feature-scoped |
| Database | Backend | Full-Stack (consulted for complex module schema) | Backend retains core schema authority |
| API | Backend | Full-Stack (consumes + extends for owned modules) | Backend retains contract authority |
| Authentication | Backend | Full-Stack (informed) | Not owned here |
| Business Logic | Backend / Full-Stack | — | Full-Stack owns logic specific to its modules |
| Integrations | Full-Stack | Backend (abstraction layer) | Full-Stack owns end-to-end integration work |
| Testing | Full-Stack | Frontend, Backend | Owns end-to-end/integration testing |
| Documentation | Full-Stack | — | Documents owned modules end-to-end |
| Deployment | Full-Stack / DevOps | Frontend, Backend | Shared, Full-Stack often coordinates release readiness |
| Code Review | Full-Stack Lead | Frontend/Backend Leads (for touched shared code) | All PRs reviewed |
| Design Review | UI/UX | Full-Stack (informed) | Not owned here |
| Security | Backend | Full-Stack (applies standards in owned modules) | Shared |
| Performance | Full-Stack | Frontend, Backend | End-to-end performance for owned modules |
| Accessibility | Frontend / UI/UX | Full-Stack (implements in owned UI) | Shared |
| Client Customization | Full-Stack | Backend, Frontend | Coordinates config across layers for complex modules |

---

## 5. AXIVON ONE Architecture Understanding

```text
AXIVON ONE
│
├── Core            → Full-Stack: supports integration, does not own core services
├── Shared Services → Full-Stack: consumes (Notifications, File, Search), extends where needed
├── Reusable Modules → Full-Stack: owns complex ones end-to-end (e.g., Billing, Reporting)
├── Industry Modules → Full-Stack: primary owner for full end-to-end delivery
└── Client Configuration → Full-Stack: coordinates configuration across frontend/backend for owned modules
```

Full-Stack sits **across** the other three teams' boundaries specifically where a feature's complexity or cross-cutting nature makes single-team ownership inefficient.

---

## 6. When a Feature Should Be Assigned to Full-Stack

| Signal | Assign to Full-Stack? |
|---|---|
| Feature requires deep frontend AND backend business logic tightly coupled (e.g., real-time invoice calculation + rendering) | Yes |
| Feature is a straightforward CRUD screen using existing patterns | No — Frontend + Backend independently |
| Feature integrates a third-party service touching both UI and backend (e.g., payment gateway) | Yes |
| Feature is purely visual/UX polish | No — Frontend |
| Feature is purely backend logic/data processing with no UI change | No — Backend |
| Feature is an admin/internal tool needed quickly, cutting across modules | Yes |
| Feature is a new Industry Module (first full build for a client) | Yes, with Frontend/Backend support as needed |

---

## 7. Team Module Ownership

| Module | Purpose | Team Responsibility | Dependencies | Deliverables | Reusability Requirement | Completion Criteria |
|---|---|---|---|---|---|---|
| Billing & Payment | Invoice generation, payment status, provider abstraction | Full end-to-end ownership | Backend core (Org, Auth), Frontend component library | Working billing module (UI + API + integration) | Provider-agnostic, reusable across industries | Tested end-to-end, integrated |
| Reporting | Cross-module reporting/exports | Full end-to-end ownership | Backend data APIs, Frontend charting components | Reporting module | Configurable per module/data source | Handles multiple data sources without rework |
| Admin/Internal Tools | Platform operations tooling | Full end-to-end ownership | Core services | Internal admin app/screens | Reusable across future internal needs | Usable by non-engineering ops staff |
| Industry Module (first instance, e.g., Education) | Full vertical delivery | Full end-to-end ownership, supported by Frontend/Backend | Reusable business modules | Complete industry module | Built from reusable patterns, minimal net-new | Client-ready, tested |

---

## 8. Detailed Module Breakdown (Full-Stack Perspective)

### Module: Billing & Payment (Example Complex Module)

**Purpose:** End-to-end invoice generation and payment tracking reused across every client and industry that bills customers.

**Features:** Invoice creation, line items, tax/discount calculation, invoice status, payment recording, payment provider integration, payment status webhooks.

**User Roles:** Org Admin, Billing Staff, End Customer (view-only for their own invoices, depending on client configuration).

**User Flows:** Create invoice → review → send → customer views/pays → status updates automatically or manually.

**UI Requirements:** Uses existing design system components (forms, tables, detail views) — no new component patterns unless genuinely novel (e.g., a line-item editor may be a new reusable component, built in coordination with UI/UX and Frontend).

**Frontend Requirements:** Line-item form with live calculation, invoice status display, payment history view — built using shared component library, contributed back to it if broadly reusable.

**Backend Requirements:** Invoice/payment entities, tax/discount calculation logic, payment provider abstraction (provider **TBD** — Architecture/Technical Lead and Product to select based on target markets), webhook handling for async payment status updates.

**Database Requirements:** `invoices`, `invoice_items`, `payments` entities, tenant-scoped, indexed by organization and status for reporting queries.

**API Requirements:** `POST /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/payments`, provider webhook endpoint — conventions aligned with Backend Team's API standards (see `03-BACKEND-TEAM.md`).

**Integration Requirements:** Payment provider integration is abstracted behind an internal interface so providers can be swapped per region/client without touching business logic.

**Security Requirements:** PCI-relevant data (if any) never stored directly — delegate sensitive card data handling to the provider's hosted fields/tokenization; webhook signature verification required.

**Testing Requirements:** Unit tests (calculation logic), integration tests (API + DB), end-to-end tests (create invoice → pay → status update), provider sandbox testing.

**Documentation Requirements:** End-to-end module documentation covering UI, API, and integration setup — single source since this module is cross-cutting.

**Reusability Requirement:** No hardcoded tax rules or currency assumptions — configurable per organization/region.

**Definition of Done:** Fully implemented across UI and API, integrated with a payment provider (sandbox verified), tested end-to-end, documented, reviewed by both Frontend and Backend leads for shared-code impact.

*(Reporting, Admin/Internal Tools, and each Industry Module follow the same end-to-end breakdown structure, tracked as individual backlog items referencing this template.)*

---

## 9. Reusability Rules

- Do not rebuild a Frontend component or Backend service that already exists — extend or configure it.
- When a genuinely new reusable component or service emerges from a Full-Stack feature, contribute it back to the shared Frontend component library or Backend core services (with the owning team's review), rather than keeping it siloed inside the Full-Stack module.
- Keep cross-cutting modules (Billing, Reporting) provider-agnostic and industry-agnostic where possible.
- Document every dependency a Full-Stack module has on Core/Reusable services.
- Version and changelog owned modules like any other reusable module.

---

## 10. Team Workflow

```text
Requirement
↓
Analysis (end-to-end scope: UI + API + integration)
↓
Planning (identify what's reused vs. net-new)
↓
Technical Design (cross-layer design, reviewed with Frontend/Backend Leads if shared code is touched)
↓
Development (frontend + backend, in parallel or sequential per feature shape)
↓
Integration (third-party, cross-module)
↓
Testing (unit, integration, end-to-end)
↓
Review (code review from both Frontend and Backend perspectives where relevant)
↓
Documentation
↓
Release
```

---

## 11. Cross-Team Handoff

```text
UI/UX (design for owned module)
↓
Full Stack (implements end-to-end)
↓
Backend (core services consumed, contract alignment)
↓
Frontend (shared component contributions reviewed)
↓
QA / Release
```

**Handoff Checklist (Full-Stack → Frontend/Backend, when contributing back shared code):**
- [ ] New component/service reviewed by owning team lead before merging into shared library/core
- [ ] Documentation updated in the shared library/core docs, not only in the Full-Stack module docs
- [ ] No client-specific logic leaked into the contributed shared code

**Handoff Checklist (Full-Stack → QA/Release):**
- [ ] End-to-end tests passing
- [ ] Third-party integration verified in sandbox/staging
- [ ] Production readiness checklist completed (see §16)

---

## 12. Git & GitHub Workflow

Full-Stack typically works across both the frontend and backend repositories (or a shared monorepo, if that's the chosen structure — **TBD, Architecture/Technical Lead to decide monorepo vs. polyrepo**).

**Branch strategy (same convention across all teams for consistency):**
```text
main
│
├── develop
│
├── feature/<ticket-id>-short-description
├── fix/<ticket-id>-short-description
├── refactor/<ticket-id>-short-description
└── release/<version>
```

Trunk-based development with short-lived feature branches, consistent with Frontend and Backend teams, to keep cross-repo/cross-layer features easy to coordinate and merge.

**PR rules:** For features touching shared Frontend components or Backend core services, require review from the owning team's lead in addition to Full-Stack Lead approval.

**Commit convention:** `feat(billing): add invoice line-item calculation`, `fix(payments): correct webhook signature validation`.

**Merge rules:** Squash-merge features into `develop`; coordinate merge order across repos/layers when a feature spans both to avoid broken intermediate states.

**Conflict handling:** Rebase on latest `develop` in each affected repo before PR.

**Release tags:** Coordinate versioning across frontend/backend if a Full-Stack feature ships across both simultaneously.

**Issue tracking:** Cross-cutting features tracked as a single Epic/Feature with linked tasks per layer (UI task, API task, integration task) for visibility.

---

## 13. Task Management

```text
Epic: AXIVON Billing & Payment Module
↓
Feature: Invoice Creation & Payment Tracking
↓
User Story: As Billing Staff, I can create and send an invoice to a customer
↓
Task: Build invoice creation UI + API end-to-end
↓
Sub-task: Integrate payment provider sandbox and verify webhook handling
```

---

## 14. Agile Development

- **Product backlog:** Full-Stack tasks linked to Epics for complex/cross-cutting features
- **Sprint planning:** Commit to end-to-end feature slices with clear acceptance criteria across UI + API
- **Sprint goal:** e.g., "Ship working Billing module against sandbox payment provider"
- **Daily stand-up:** Blockers spanning multiple layers reported clearly (e.g., "blocked on Backend's Org service API for tenant-scoped invoices")
- **Refinement:** Full-Stack flags when a feature should be split back to Frontend/Backend instead of kept as Full-Stack scope
- **Review:** Demo complete, working end-to-end features
- **Retrospective:** Full team, with specific attention to cross-team handoff friction

**Coordination:** Full-Stack synchronizes closely with Backend (for core service dependencies) and Frontend (for shared component contributions), often participating in both teams' refinement sessions when a feature touches their domains.

---

## 15. Sprint Planning (Recommended Baseline)

| Sprint | Full-Stack Focus |
|---|---|
| Sprint 0 | Environment setup, understand core architecture decisions, define production-readiness checklist |
| Sprint 1–2 | Support Core module integration (Auth, User, Org) end-to-end smoke testing |
| Sprint 3–4 | Begin first complex module (e.g., Notifications end-to-end, or Billing groundwork) |
| Sprint 5+ | Full ownership of Billing/Payment, Reporting, Admin tooling, then first Industry Module |

Adjust based on actual capacity; this is a baseline, not a commitment.

---

## 16. Definition of Ready (Full-Stack)

- [ ] End-to-end acceptance criteria defined (UI + API + integration)
- [ ] Dependencies on Core/Reusable services identified
- [ ] Third-party integration requirements known (or explicitly flagged as TBD)
- [ ] Clear on what's reused vs. net-new

## 17. Definition of Done (Full-Stack)

- [ ] Implementation complete across UI and API
- [ ] Code reviewed (including by Frontend/Backend leads if shared code touched)
- [ ] Unit, integration, and end-to-end tests passing
- [ ] Third-party integrations verified in sandbox/staging
- [ ] Error handling implemented across the full flow
- [ ] Responsive/accessible where UI is involved
- [ ] Documentation complete (end-to-end)
- [ ] No critical defects
- [ ] Production readiness checklist completed
- [ ] PR(s) merged across all touched repos/layers

---

## 18. Quality Standards

- **End-to-end reliability:** The full user flow works, not just isolated pieces.
- **Integration quality:** Third-party integrations handle failure gracefully (timeouts, retries where appropriate).
- **Maintainability:** Code follows both Frontend and Backend teams' conventions — Full-Stack does not introduce a third style.
- **Testing:** End-to-end coverage on critical owned flows.
- **Production readiness:** Owned modules include monitoring/logging hooks consistent with platform standards.

---

## 19. Security Requirements

- Apply Backend Team's security standards (input validation, authorization enforcement) in all backend code Full-Stack writes.
- Apply Frontend Team's security standards (safe rendering, no secrets in client code) in all frontend code Full-Stack writes.
- Third-party integrations: verify webhook signatures, use least-privilege API keys, never log sensitive payment/PII data.
- Escalate any security question outside clear precedent to Backend Lead before implementing.

---

## 20. Testing Strategy (Full-Stack Scope)

| Test Type | Owner |
|---|---|
| Unit testing (owned module logic, both layers) | Full-Stack |
| Integration testing (owned module, API + DB) | Full-Stack |
| End-to-end testing (platform-wide critical flows) | Full-Stack (owns) |
| Third-party integration testing | Full-Stack |
| Regression testing (owned modules) | Full-Stack |
| Performance testing (owned modules) | Full-Stack, with Backend/Frontend input |
| Security testing | Full-Stack applies standards, Backend reviews |

---

## 21. Documentation Requirements

- End-to-end module documentation (UI + API + integration in one place, since the module is cross-cutting).
- Third-party integration setup guides (sandbox credentials, webhook configuration).
- Architecture notes for any cross-layer design decisions.
- Known limitations and troubleshooting for owned modules.
- Change log per module release.

---

## 22. Deliverables

**Phase 1 (MVP):** End-to-end smoke testing support for Core modules; production-readiness checklist defined.
**Phase 2 (V1):** Notifications end-to-end verification, groundwork for Billing/Payment.
**Phase 3 (V2):** Full Billing & Payment module, Reporting module, Admin/Internal tooling.
**Future:** First Industry Module full delivery, additional third-party integrations as clients require them.

---

## 23. Team Checklist

- [ ] Requirement understood end-to-end
- [ ] Dependencies on Core/Reusable services identified
- [ ] Work assigned across layers
- [ ] Development completed (UI + API + integration)
- [ ] Review completed (including cross-team review where shared code touched)
- [ ] Testing completed (unit, integration, E2E)
- [ ] Documentation completed
- [ ] Handoff/integration completed
- [ ] PR(s) merged
- [ ] Definition of Done satisfied

---

## 24. Common Mistakes to Avoid

- Bypassing Frontend/Backend team standards because "it's a Full-Stack feature."
- Creating isolated solutions that duplicate existing shared components/services instead of extending them.
- Poor integration testing, leading to features that work in isolation but break in the full flow.
- Skipping documentation because the feature "seemed self-contained."
- Not contributing genuinely reusable pieces back to the shared Frontend library or Backend core.
- Taking on features that should have stayed with a single team, causing unnecessary cross-team confusion.

---

## 25. Escalation Process

| Issue Type | Contact | Documentation |
|---|---|---|
| Requirement ambiguity | Product Management | Comment on linked issue |
| Architecture problem (cross-layer) | Architecture/Technical Lead | Architecture decision record |
| Dependency blockage (Core service not ready) | Backend Lead | Sprint board flag |
| Design conflict | UI/UX Lead | Design review note |
| API conflict | Backend Lead | Shared API doc + issue thread |
| Security issue | Backend Lead (immediate) | Private security channel, incident log |
| Deadline risk | Full-Stack Lead → Engineering Manager | Sprint board flag |
| Production issue | Full-Stack Lead + DevOps | Incident log |

---

## 26. Communication Rules

- Daily stand-up in team channel, explicitly noting which layer(s) are blocked.
- Cross-team code contributions discussed on the PR, with the owning team's lead tagged.
- Architecture decisions for cross-cutting features recorded in the shared architecture decision log.
- Third-party integration issues documented with provider, environment, and reproduction steps — not left in chat.

---

## 27. Performance & Scalability

- Design owned modules (Billing, Reporting) to handle growth in organizations and transaction volume without redesign.
- Avoid synchronous processing for slow third-party calls (webhooks, batch reporting) — use asynchronous/background processing where the platform's job infrastructure supports it.
- Do not over-engineer for scale the platform doesn't have yet — build for the MVP's realistic load, with a documented path to scale.

---

## 28. Client Customization Model

```text
AXIVON CORE
+
REUSABLE MODULES (including Full-Stack-owned: Billing, Reporting)
+
INDUSTRY MODULES (Full-Stack-led delivery)
+
CLIENT CONFIGURATION (provider selection, business rule parameters)
+
CUSTOM FEATURES (Full-Stack is typically the team that scopes and, if approved, builds these — isolated from core, reviewed by Architecture Lead)
=
CLIENT PROJECT
```

**Configurable:** Payment/notification provider selection, tax/currency rules, report templates, industry module enablement.
**Not configurable (core platform):** Core service contracts, shared component internals, platform-wide security standards.

---

## 29. Final Team Responsibility Summary

- **Owns:** End-to-end delivery of complex, cross-cutting modules; third-party integrations; end-to-end testing; production readiness for owned modules.
- **Contributes:** Complete, reusable, production-ready modules that Frontend and Backend teams don't have to piece together after the fact.
- **Must deliver:** Fully integrated, tested, documented features spanning UI and API.
- **Must never do:** Duplicate what Frontend/Backend already own; bypass either team's standards; leave genuinely reusable work siloed instead of contributing it back to shared libraries/services.
- **Success looks like:** Complex modules like Billing or a new Industry Module ship as complete, working, production-ready features — not a pile of disconnected frontend and backend pieces requiring last-minute integration work.

---

## Team Collaboration Matrix

| Activity | UI/UX | Frontend | Backend | Full Stack |
|---|---|---|---|---|
| Requirements | Secondary | Secondary | Secondary | Primary (for owned modules) |
| UX | Primary | Informed | Informed | Consulted |
| UI | Primary | Secondary | Informed | Primary (owned modules) |
| Architecture | Consulted | Secondary | Secondary | Primary (cross-layer) |
| Database | Informed | Informed | Primary | Secondary (owned modules) |
| API | Informed | Secondary | Primary | Secondary (owned modules) |
| Implementation | Consulted | Primary (frontend) | Primary (backend) | Primary (owned modules) |
| Testing | Secondary | Primary | Primary | Primary (end-to-end) |
| Integration | Informed | Secondary | Secondary | Primary |
| Documentation | Secondary | Secondary | Secondary | Primary (owned modules) |
| Release | Informed | Secondary | Secondary | Primary |
