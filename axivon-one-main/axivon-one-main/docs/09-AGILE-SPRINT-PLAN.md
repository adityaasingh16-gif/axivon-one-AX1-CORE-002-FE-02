# 09-AGILE-SPRINT-PLAN.md

## 1. Document Information

| Field | Value |
|---|---|
| Project | AXIVON ONE — Modular Business & Digital Platform |
| Document | Agile Sprint Plan |
| Version | 1.0 |
| Status | Draft — Living Document |
| Owner | Product Management / Engineering Manager |
| Audience | UI/UX Team, Frontend Team, Backend Team, Full-Stack Team, Product Management, Engineering Leadership |
| Purpose | Defines the single, shared Agile process all four teams execute against — consolidating the team-specific Agile sections already established in `01`–`04` and the sprint roadmap already introduced in `00-PROJECT-OVERVIEW.md` §30–32 into one operational plan, and filling in the detail (roles, ceremonies, estimation, quality gates, metrics) those documents deliberately left to a shared standard |
| Related Documents | `00-PROJECT-OVERVIEW.md`, `01-UI-UX-TEAM.md`, `02-FRONTEND-TEAM.md`, `03-BACKEND-TEAM.md`, `04-FULL-STACK-TEAM.md`, `05-SYSTEM-ARCHITECTURE.md`, `06-DATABASE-ARCHITECTURE.md`, `07-API-SPECIFICATION.md`, `08-GIT-GITHUB-STANDARD.md` |

This document does not introduce a sprint cadence, task hierarchy, or team coordination model that conflicts with `00-PROJECT-OVERVIEW.md` §30–32 or the individual Agile sections in `01`–`04` (§14–19 in `01`/`02`, §16–20 in `03`, §13–17 in `04`) — those already establish the task hierarchy, per-team sprint baselines, and Definitions of Ready/Done this document builds on and consolidates.

---

## 2. Agile Objective

`00-PROJECT-OVERVIEW.md` §30 is explicit: **AXIVON ONE is developed using Agile, not Waterfall.** This document explains why that matters specifically for a reusable platform, and puts it into practice.

- **Incremental delivery** — the Core Platform, then Reusable Modules, then Industry Modules (`00-PROJECT-OVERVIEW.md` §12–17) are built and validated in that order, in working increments — never as one large, all-at-once release.
- **Feedback** — each sprint's working software (§25) is reviewed by Product and, where relevant, a pilot client, so assumptions about reusability are tested against reality early, not after months of unvalidated work.
- **Adaptability** — because AXIVON ONE explicitly defers many technology and scope decisions (`TBD` markers throughout `00`, `05`, `06`, `07`), the process needs to absorb new information sprint over sprint, not commit everything upfront the way Waterfall would.
- **Continuous improvement** — the Retrospective (§6, §26) gives every team, every sprint, a structured way to improve how they work, not just what they build.
- **Early validation** — the MVP (`00-PROJECT-OVERVIEW.md` §17) exists specifically to validate the Core Platform and reusability model *before* Industry Modules are attempted; Agile's incremental structure is what makes that early validation possible.
- **Team collaboration** — four teams contributing to one platform need a shared rhythm (§4) — Agile ceremonies are the mechanism that keeps Backend's API work, Frontend's UI work, UI/UX's design work, and Full-Stack's cross-cutting work synchronized without constant ad hoc coordination.
- **Risk reduction** — per `00-PROJECT-OVERVIEW.md` §35's risk register, "over-engineering the Core before real usage validates it" and "scope creep into industry modules too early" are both named risks; Agile's short feedback loops and gated backlog (§32–33) are the primary mitigation for both.

---

## 3. Agile Structure

```text
Product Vision           (00-PROJECT-OVERVIEW.md §3)
   ↓
Product Backlog          (§8 of this document)
   ↓
Epic                     (a large body of work, e.g., "Core Identity & Access")
   ↓
Feature                  (a meaningful, shippable slice of an Epic)
   ↓
User Story               (a user-facing description of value)
   ↓
Task                     (a concrete unit of implementation work, owned by one team)
   ↓
Sub-task                 (a smaller unit within a Task, where useful)
```

This hierarchy is already used identically across `01-UI-UX-TEAM.md` §15, `02-FRONTEND-TEAM.md` §15, `03-BACKEND-TEAM.md` §16, and `04-FULL-STACK-TEAM.md` §13 — this document confirms it as the platform-wide standard, not a new invention.

| Level | Explanation | Example |
|---|---|---|
| **Product Vision** | The long-term "why" — AXIVON ONE as the company's reusable foundation (`00-PROJECT-OVERVIEW.md` §3) | — |
| **Product Backlog** | The full, prioritized list of everything not yet done (§8) | — |
| **Epic** | Large, multi-sprint body of work | "AXIVON Core Identity & Access" |
| **Feature** | A meaningful slice of an Epic, typically completable within one to a few sprints | "Role & Permission Management" |
| **User Story** | A specific, testable increment of user-facing value (§11) | "As an Org Admin, I can create custom roles from a permission catalog" |
| **Task** | A concrete, single-team unit of work under a Story | "Implement role CRUD API with permission assignment" |
| **Sub-task** | An optional finer breakdown of a Task | "Write integration tests for permission inheritance" |

---

## 4. Four-Team Agile Model

```text
UI/UX  →  Frontend  ⇄  Backend  ⇄  Full Stack
```

All four teams work toward **one shared sprint goal**, not four independent goals that happen to be scheduled at the same time — this is the single most important rule in this section, and it's why `01`–`04`'s individual Agile sections all reference the same Epics/Features rather than team-private backlogs.

- **Shared sprint goal:** each sprint has one goal statement (e.g., "Ship Org/Tenant service with data isolation verified," per `03-BACKEND-TEAM.md` §17's example), and every team's committed work for that sprint ladders up to it.
- **Team-specific tasks:** within the shared goal, each team pulls the Tasks that belong to their discipline — UI/UX designs it, Frontend builds the UI, Backend builds the API, Full-Stack integrates and handles the cross-cutting pieces.
- **Cross-team dependencies:** made explicit and tracked (§17), not discovered mid-sprint. A Frontend Task blocked on a Backend API contract is visible on the shared board (`08-GIT-GITHUB-STANDARD.md` §16) before the sprint starts, not after.
- **Parallel work:** enabled by the staggered coordination model below — teams are not idle waiting for each other; they work on adjacent, appropriately-sequenced pieces simultaneously.
- **Handoffs:** formally defined (§24) so a handoff is a specific, checkable event, not an assumption.
- **Integration:** Full-Stack (and, for smaller integrations, whichever team owns the seam) verifies that what UI/UX designed, Frontend built, and Backend implemented actually work together end-to-end before a Story is called Done (§15).

### Staggered Coordination (Confirmed, per `01`–`04`)

```text
Sprint N:    UI/UX designs Feature X (one sprint ahead)
Sprint N+1:  Frontend builds Feature X's UI (against approved design + Backend's API contract, mocked if needed)
             Backend builds Feature X's API (in parallel with Frontend)
             Full-Stack integrates Feature X once both are ready, and/or works ahead on cross-cutting groundwork
```

- **UI/UX works one sprint ahead of Frontend** (`01-UI-UX-TEAM.md` §16) — Sprint Planning has UI/UX committing to *next* sprint's design needs, not the current one.
- **Frontend and Backend work in parallel** against an agreed API contract (`07-API-SPECIFICATION.md` §32), with Frontend using a mock/stub (`07-API-SPECIFICATION.md` §43) until the real Backend implementation is ready (`02-FRONTEND-TEAM.md` §16, `03-BACKEND-TEAM.md` §17).
- **Full-Stack synchronizes with both**, often joining both teams' refinement sessions when a feature touches their domain (`04-FULL-STACK-TEAM.md` §14), and takes ownership of genuinely cross-cutting features end-to-end (e.g., Billing/Payments integration).
- **Backend can work independently** on infrastructure/data-layer work that has no immediate Frontend dependency (e.g., migration groundwork, `08-GIT-GITHUB-STANDARD.md` §27), keeping Backend productive even in sprints where Frontend is blocked on design.

This is not four disconnected Agile processes — it is one process with four disciplines moving through it at a deliberately staggered offset, exactly as `01-UI-UX-TEAM.md` §16 and `00-PROJECT-OVERVIEW.md` §32 already describe.

---

## 5. Roles

No employee names are used — role titles only, and a small organization may combine several of these in one person.

| Role | Responsibility |
|---|---|
| **Product Owner** | Owns the Product Backlog's priority order (§39); the single voice for "what matters most next," representing business/client needs |
| **Project/Product Manager** | Coordinates cross-team planning, tracks overall delivery against the roadmap (§18), removes organizational blockers |
| **Scrum Master / Agile Facilitator** | Runs ceremonies (§6), protects the team from scope disruption mid-sprint (§32), surfaces blockers (§23) |
| **UI/UX Lead** | Owns design quality and the design system (`01-UI-UX-TEAM.md`); approves designs before handoff |
| **Frontend Lead** | Owns Frontend code quality and architecture (`02-FRONTEND-TEAM.md`); approves Frontend PRs |
| **Backend Lead** | Owns Backend/API code quality, architecture, and the API standard (`07-API-SPECIFICATION.md`); approves Backend PRs |
| **Full-Stack Lead** | Owns cross-cutting feature delivery and integration quality (`04-FULL-STACK-TEAM.md`); approves Full-Stack PRs |
| **Developers** (Frontend, Backend, Full-Stack) | Implement Tasks, participate in ceremonies, review peers' PRs (`08-GIT-GITHUB-STANDARD.md` §10) |
| **Designers** | Produce and maintain design work under the UI/UX Lead |
| **QA/Testing responsibility** | Not a separate, dedicated team in AXIVON ONE's current four-team structure — testing is a shared responsibility embedded in each team's Definition of Done (`01`–`04` §18–20/§16–17), with Full-Stack additionally responsible for end-to-end/integration testing (`04-FULL-STACK-TEAM.md` §17). A dedicated QA role is a **Future** possibility once team size and module count justify it. |

In a small organization, the Product Owner and Project/Product Manager may be the same person; a Team Lead may also act as Scrum Master for their team's portion of a ceremony. What must **not** be combined: a Lead should not be the sole reviewer of their own PRs (`08-GIT-GITHUB-STANDARD.md` §10).

---

## 6. Ceremonies

| Ceremony | Purpose | Participants | Inputs | Outputs | Suggested Duration |
|---|---|---|---|---|---|
| **Sprint Planning** | Commit to a sprint goal and the Stories that achieve it | Product Owner, all four Team Leads, developers/designers as capacity requires | Refined, Ready backlog items (§14); team capacity | Sprint goal, sprint backlog, task breakdown (§16) | 1.5–2 hours, at the start of each sprint |
| **Daily Stand-up** | Quick sync on progress and blockers | Each team, separately (staggered by discipline where useful); cross-team blockers escalated immediately, not held for stand-up | Yesterday's progress | Updated board status (§14 of `08-GIT-GITHUB-STANDARD.md`), flagged blockers (§23) | 10–15 minutes per team |
| **Backlog Refinement** | Clarify, size, and prepare upcoming Stories so they can meet the Definition of Ready (§14) | Product Owner, relevant Team Leads, UI/UX (one sprint ahead per §4) | Raw/loosely-defined backlog items | Refined, estimated, dependency-mapped Stories | 1 hour, once or twice per sprint |
| **Sprint Review** | Demonstrate working software against the sprint goal | All four teams, Product, stakeholders as relevant | Completed (Done, §15) work from the sprint | Feedback, accepted/rejected Stories, updated backlog | 30–60 minutes, at the end of each sprint |
| **Sprint Retrospective** | Reflect on process, not just output | All four teams | The sprint just completed | Action items (§26) for the next sprint | 45–60 minutes, immediately after Sprint Review |

This ceremony set is deliberately kept to five recurring meetings — no additional standing ceremonies are layered on top without a specific, demonstrated need, per `00-PROJECT-OVERVIEW.md` §40's "do not over-engineer prematurely," extended here to process as much as architecture.

---

## 7. Sprint Length

| Length | Trade-off for AXIVON ONE |
|---|---|
| **1 week** | Too short for a four-team platform with genuine cross-team dependencies (§4, §17) — most sprints would be consumed by ceremony overhead relative to actual delivery, and the staggered UI/UX-ahead model (§4) barely has room to breathe |
| **2 weeks** | Long enough for a Feature-sized slice of work to move from design through integration across all four teams, short enough to keep feedback loops tight and course-correct quickly if a module's design turns out to be wrong |
| **3 weeks** | Feedback loops become noticeably slower; risk of sprints quietly absorbing scope creep (§32) increases as the time-box grows; less pressure to keep Stories appropriately small |

**Recommended baseline: 2 weeks.** This matches the granularity already implied by the per-team sprint baselines in `01-UI-UX-TEAM.md` §17, `02-FRONTEND-TEAM.md` §17, `03-BACKEND-TEAM.md` §18, and `04-FULL-STACK-TEAM.md` §15 (each describing sprint-sized chunks like "Auth flow design" or "User management, Roles & Permissions" — work that fits comfortably into two weeks per team, per sprint, without either starving the sprint or requiring artificial padding).

---

## 8. Product Backlog

The AXIVON ONE backlog is organized by major area, mirroring the platform structure in `00-PROJECT-OVERVIEW.md` §12:

```text
Foundation           → repo setup, CI/CD, coding standards, environment setup
Core Platform        → Auth, Users, Roles, Permissions, Organization/Tenant, Dashboard, Settings, Audit Logs
Shared Services      → Notifications, File Management, Search, Reporting
Business Modules     → CRM, Tasks, Projects, Products, Services, Billing, Payments
Industry Modules     → Education, Hospital, Restaurant, Hotel, E-Commerce (Future, per 00-PROJECT-OVERVIEW.md §16)
Client Configuration → branding, enabled modules, business rules tooling
Technical Debt       → tracked per §28
Security             → tracked with priority discipline per §10, never silently deferred
Performance          → tracked once real usage data justifies specific work (per 00-PROJECT-OVERVIEW.md §40)
Documentation        → this documentation series and in-code documentation
```

Every backlog item belongs to exactly one major area and, within it, to an Epic (§9). The Product Owner maintains priority order *within and across* these areas — Foundation and Core Platform items are prioritized ahead of Business Modules, which are prioritized ahead of Industry Modules, following the phased approach `00-PROJECT-OVERVIEW.md` §19–20 already lays out, unless a specific, documented reason justifies reordering (§32).

---

## 9. Epic Structure

Initial Epics, matching the module catalog in `00-PROJECT-OVERVIEW.md` §14–15 exactly, with MVP/V1/V2/Future phasing carried over rather than treating every Epic as equally urgent:

| Epic | Phase (per `00-PROJECT-OVERVIEW.md` §14–15) |
|---|---|
| EPIC 01 — Project Foundation | MVP |
| EPIC 02 — Design System | MVP |
| EPIC 03 — Authentication & Identity | MVP |
| EPIC 04 — User & Role Management | MVP |
| EPIC 05 — Organization/Tenant | MVP |
| EPIC 06 — Dashboard | MVP (shell only) |
| EPIC 07 — Notifications | MVP |
| EPIC 08 — File Management | MVP |
| EPIC 09 — Audit Logs | MVP |
| EPIC 10 — CRM | MVP (Customers, Leads); V1 (Contacts, Activities per `07-API-SPECIFICATION.md` §36) |
| EPIC 11 — Task Management | MVP |
| EPIC 12 — Project Management | V1 |
| EPIC 13 — Billing | V1 |
| EPIC 14 — Industry Modules | V2/Future |

**Not all of these are MVP** — nine of the fourteen Epics above are MVP-phase; Project Management, Billing, and Industry Modules are explicitly sequenced later, per `00-PROJECT-OVERVIEW.md` §17–19. The Product Owner does not pull a V1/V2 Epic's Stories into an MVP sprint without a documented reason (§32).

---

## 10. Priority System

```text
P0 — Critical   : blocks the platform or a committed sprint goal; security vulnerabilities; production outages
P1 — High       : required for the current MVP/V1/V2 phase's core scope; significant client-facing defects
P2 — Medium     : valuable, non-blocking improvements; most net-new Feature work outside the current phase's critical path
P3 — Low        : nice-to-have; deferred without meaningfully affecting the roadmap
```

Priority is set at the Story/Bug level during refinement (§6) and revisited if circumstances change (e.g., a `P2` becomes `P0` if it turns out to block a committed Sprint Goal). Priority is never used as a substitute for Estimation (§13) — a `P0` Story can still be large, and a `P3` Story can still be quick.

---

## 11. User Story Standard

```text
As a [user]
I want [capability]
So that [benefit]
```

Every Story additionally requires:

- **Acceptance criteria** — in Given/When/Then format (§12).
- **Dependencies** — links to blocking/blocked-by Stories or cross-team handoffs (§17, §24).
- **Priority** — `P0`–`P3` (§10).
- **Estimate** — story points (§13).
- **Owner** — the individual currently driving it.
- **Team** — which of the four teams owns the primary work (a Story can span teams via linked Tasks, §3).

**Example, specific to AXIVON ONE:**

```text
As an Org Admin
I want to create custom roles from a shared permission catalog
So that I can control what my team members can see and do without requesting code changes
```

---

## 12. Acceptance Criteria

Format:

```text
Given [a starting context]
When [an action occurs]
Then [an outcome is expected]
```

**Examples, specific to AXIVON ONE:**

```text
Given I am logged in as an Org Admin
When I submit a new role with a valid name and at least one permission
Then the role is created and appears in the Roles list

Given I am logged in as a user without the "crm.customer.create" permission
When I attempt to create a Customer via the API
Then I receive a 403 Forbidden response, per 07-API-SPECIFICATION.md §17

Given a Customer exists in Organization A
When a user from Organization B requests that Customer's record
Then a 404 Not Found response is returned, per 07-API-SPECIFICATION.md §18's tenant-isolation rule
```

Acceptance criteria for API-touching Stories are written to be directly testable against `07-API-SPECIFICATION.md`'s documented behavior wherever the Story implements an already-specified endpoint, so "Done" (§15) has an unambiguous, checkable definition.

---

## 13. Estimation

| Method | Trade-off |
|---|---|
| **Story points** | Abstracts away time, forcing the team to estimate *relative complexity/effort/uncertainty* rather than a false-precision hour count; scales naturally as the team's velocity (§27) is measured empirically over sprints |
| **T-shirt sizing** (XS/S/M/L/XL) | Faster for rough, early-stage estimation (e.g., during initial Epic-level planning) but too coarse for sprint-level commitment, where the team needs to know whether a sprint's committed Stories actually fit its capacity |

**Recommended: Story points** for Story/Task-level estimation, with T-shirt sizing reserved for early, Epic-level rough-order-of-magnitude discussions before a Feature is broken into Stories (e.g., "CRM Foundation is roughly an L-sized Epic" during roadmap planning, §18).

**Story points are not hours.** A 5-point Story does not mean "5 hours" or even a fixed number of hours for any individual — it means "roughly this much relative effort/complexity/uncertainty, calibrated against Stories the team has already completed." Converting story points directly to a time estimate for an individual, or worse, using them to judge how "productive" a specific person was in a sprint, is a common Agile mistake (§38) and is explicitly not how estimates are used in AXIVON ONE.

---

## 14. Definition of Ready

A Story is ready for sprint planning (§16) only when:

- [ ] Requirement understood — the Story's "so that" is clear to the team, not just the Product Owner.
- [ ] Acceptance criteria defined (§12).
- [ ] Dependencies identified (§17) — including cross-team handoffs (§24) this Story requires.
- [ ] Design available where required — matching UI/UX's own Definition of Ready (`01-UI-UX-TEAM.md` §18) for anything user-facing.
- [ ] API contract available where required — matching Frontend's Definition of Ready (`02-FRONTEND-TEAM.md` §18): an approved contract, or explicit agreement to build against a mock (`07-API-SPECIFICATION.md` §43).
- [ ] Technical uncertainty addressed — significant unknowns (especially around the platform's many `TBD` technology decisions) are resolved or explicitly scoped as a spike before commitment.
- [ ] Owner/team identified.

This project-wide Definition of Ready is satisfied *in addition to* each team's own (`01` §18, `02` §18, `03` §19, `04` §16) — a Story touching multiple teams must meet every relevant team's criteria, not just one.

---

## 15. Definition of Done

Project-wide Definition of Done — a Story is Done only when:

- [ ] Requirement satisfied — acceptance criteria (§12) verified.
- [ ] Design complete — matches `01-UI-UX-TEAM.md` §19's Definition of Done for any user-facing element.
- [ ] Development complete — matches the relevant team's own Definition of Done (`02` §19, `03` §20, `04` §17).
- [ ] Testing complete — unit, integration, and (where applicable) end-to-end, per each team's standard.
- [ ] Security considered — authorization/tenant-scoping verified for any Backend-touching change (`07-API-SPECIFICATION.md` §18, §28).
- [ ] Documentation complete — including `07-API-SPECIFICATION.md` updates for any API change.
- [ ] Code review complete (`08-GIT-GITHUB-STANDARD.md` §10).
- [ ] Integration complete — the piece actually works with the rest of the system it depends on, not just in isolation.
- [ ] Acceptance criteria passed — verified in Sprint Review (§25), not just claimed.
- [ ] No critical defects — no known `P0`/`P1` bug introduced by this Story remains open (§29).
- [ ] PR merged (`08-GIT-GITHUB-STANDARD.md` §9, §18).

A Story is not called Done because most of the above is true — every item applies, or the Story stays in progress, per §3 principle 12 of `08-GIT-GITHUB-STANDARD.md` ("do not merge unfinished work into production branches") applied to the Story level as well as the code level.

---

## 16. Sprint Planning Process

```text
Backlog Refinement (§6 — happened before Planning, not during it)
   ↓
Select Sprint Goal (Product Owner proposes; team confirms it's achievable)
   ↓
Select Stories (from the Ready backlog, §14, that ladder up to the goal)
   ↓
Identify Dependencies (§17 — cross-team and cross-Epic)
   ↓
Break Into Tasks (per team, per §3's hierarchy)
   ↓
Assign Ownership (§5)
   ↓
Commit to Sprint
```

**Four-team coordination during Planning:** all four Team Leads are present for the whole session, not just their own team's portion — because Stories frequently span teams (a CRM Story has a UI/UX design Task from last sprint, a Frontend Task, and a Backend Task, all in the same sprint per the staggered model in §4), sequencing and dependency identification has to happen with the full picture in the room, not reconstructed after the fact from four separate planning meetings.

---

## 17. Dependency Management

```text
UI/UX
  ↓
Frontend
  ⇕
Backend
  ⇕
Full Stack
```

- **UI/UX can finalize flows while Backend defines API contracts** — these two tracks don't block each other; both feed into the same Feature from different directions.
- **Frontend can use mocks while Backend implements APIs** — per `07-API-SPECIFICATION.md` §32, §43, this is the mechanism that lets Frontend proceed the moment a contract is *agreed*, not once it's *implemented*.
- **Full Stack can integrate completed pieces** — once both UI and API sides of a Feature are ready, Full-Stack (or the owning team, for smaller integrations) wires them together and verifies the end-to-end flow.
- **Backend can work independently on infrastructure/data layers** — migration work, core service hardening, and similar work with no immediate UI dependency proceeds without waiting on UI/UX or Frontend.

Every dependency identified during Refinement or Planning (§16) is recorded as a link between Issues (`08-GIT-GITHUB-STANDARD.md` §12), visible on the shared board (`08-GIT-GITHUB-STANDARD.md` §16) — a dependency that exists only as a verbal understanding between two people is treated as undocumented and therefore not yet a real dependency for planning purposes.

---

## 18. Initial Development Roadmap

This roadmap **is** the baseline already established in `00-PROJECT-OVERVIEW.md` §31, reconciled here with each team's own more detailed sprint baseline (`01` §17, `02` §17, `03` §18, `04` §15) into one shared table. It is a **recommended baseline, not a calendar commitment** — exactly as `00-PROJECT-OVERVIEW.md` §31 and each team document already state.

### Sprint 0 — Foundation & Planning

Architecture decisions, repository setup (`08-GIT-GITHUB-STANDARD.md` §4), design system foundation, coding/API/database standards, backlog setup. Detailed per-team breakdown in §20.

### Sprint 1 — Platform Foundation

Base application structure, authentication foundation, initial design system/component library, API foundation, database foundation.

### Sprint 2 — Identity

Users, Roles, Permissions, authentication completion.

### Sprint 3 — Organization

Organization/Tenant, Membership, tenant-isolation implementation, Dashboard shell.

### Sprint 4 — Shared Services

Notifications, File Management, Settings, Audit Logs.

### Sprint 5 — CRM Foundation

Customers, Leads, Contacts, Activities (per `07-API-SPECIFICATION.md` §36's MVP/V1 split — Customers/Leads are MVP; Contacts/Activities are V1 and may extend into Sprint 6 depending on capacity).

### Sprint 6 — CRM Operations

Follow-ups, Task Management, Search/Filters, basic Reporting — completing `00-PROJECT-OVERVIEW.md` §17's MVP Initial Business Capability scope.

### Sprint 7+ — Business Module Expansion (V1)

Project Management, Billing, Payments, and continued Reporting/Search maturity, per `00-PROJECT-OVERVIEW.md` §19's V1 goals — sequenced by the Product Owner based on actual MVP outcomes and client-engagement timing, not fixed in advance here.

**No exact calendar dates are promised anywhere in this roadmap** — sprint numbers denote sequence, not fixed dates, per every source document's explicit caution against treating this as a delivery-date commitment.

---

## 19. Sprint-by-Sprint Team Allocation

### Sprint 0

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Figma workspace, design tokens, initial design system foundation (`01-UI-UX-TEAM.md` §17) | Design system v0.1, Figma structure | None — starts independently |
| Frontend | Repository setup, tooling, CI setup, component library skeleton (`02-FRONTEND-TEAM.md` §17) | Scaffolded Frontend app | Repository strategy decision (`08-GIT-GITHUB-STANDARD.md` §4) |
| Backend | Architecture decisions (stack, API style, tenant strategy), repo setup, CI/CD foundation (`03-BACKEND-TEAM.md` §18) | Backend scaffolding, initial ADRs | Architecture/Technical Lead decisions (`05-SYSTEM-ARCHITECTURE.md` TBD list) |
| Full Stack | Environment setup, understand core architecture decisions, define production-readiness checklist (`04-FULL-STACK-TEAM.md` §15) | Production-readiness checklist draft | Backend's architecture decisions |

### Sprint 1

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Auth flow design, base component library (buttons, inputs, cards) | Approved Auth flow designs, component specs | Design tokens from Sprint 0 |
| Frontend | Auth UI implementation, base component library build-out | Working Auth UI (against mock or real API) | UI/UX Auth designs; Backend Auth API contract |
| Backend | Auth service, base project structure, core validation/error-handling layer | Working Auth API | API/error-format standards (`07-API-SPECIFICATION.md` §14, §16) |
| Full Stack | Support Core module integration groundwork | Integration test scaffolding | Backend Auth API availability |

### Sprint 2

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | User management, roles/permissions UI patterns | Approved designs for User/Role management | — |
| Frontend | User management UI, roles/permissions UI | Working User/Role UI | UI/UX designs; Backend User/Role API |
| Backend | User Management, Roles & Permissions (RBAC) | Working User/Role/Permission APIs | Auth foundation from Sprint 1 |
| Full Stack | Support Core module integration, end-to-end smoke testing | Auth+User smoke-tested end-to-end | Frontend + Backend Sprint 1–2 output |

### Sprint 3

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Organization/Tenant UX, Dashboard shell design | Approved designs | — |
| Frontend | Organization/Tenant UI, Dashboard shell | Working Org/Dashboard UI | UI/UX designs; Backend Org API |
| Backend | Organization/Tenant service, data isolation implementation | Working Org API with verified tenant isolation | RBAC foundation from Sprint 2 |
| Full Stack | Continue Core integration testing; begin production-readiness validation | Verified tenant-isolation test suite (per `07-API-SPECIFICATION.md` §18, §42) | Backend Org/Tenant implementation |

### Sprint 4

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Notifications, File management, Settings UI design | Approved designs | — |
| Frontend | Notifications UI, File management UI, Settings UI | Working UI for all three | UI/UX designs; Backend APIs |
| Backend | Notifications, File management, Settings, Audit logging | Working APIs for all four | Org/Tenant foundation from Sprint 3 |
| Full Stack | Begin first complex/cross-cutting module groundwork (e.g., Notification delivery end-to-end) | End-to-end verified Notification delivery | Backend Notification API |

### Sprint 5

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Reusable business module UI patterns (list/detail/form), CRM-specific screens | Approved CRM designs, generic pattern library | — |
| Frontend | Generic list/detail/form pattern, initial CRM (Customers, Leads) UI | Working CRM UI foundation | UI/UX patterns; Backend CRM API |
| Backend | Reusable business module APIs — CRM (Customers, Leads, Contacts, Activities) | Working CRM APIs | Core Platform stable from Sprints 1–4 |
| Full Stack | Support CRM integration; continue production-readiness work | CRM smoke-tested end-to-end | Frontend + Backend CRM output |

### Sprint 6

| Team | Responsibilities | Deliverables | Dependencies |
|---|---|---|---|
| UI/UX | Follow-up/Task UI patterns, basic reporting UI | Approved designs | — |
| Frontend | Follow-ups, Task Management UI, basic reporting UI | Working Task/Reporting UI | UI/UX designs; Backend APIs |
| Backend | Lead conversion, Follow-ups, Task Management API, basic reporting endpoints | Working APIs | CRM foundation from Sprint 5 |
| Full Stack | End-to-end MVP validation across Core + CRM + Tasks | MVP validation report | All Sprint 0–6 output |

---

## 20. Sprint 0 in Detail

### UI/UX

- Set up the Figma workspace and file structure (`01-UI-UX-TEAM.md` §14).
- Establish design tokens (color, typography, spacing scale).
- Build the initial design system foundation.
- Map core user flows (Auth, core navigation) at a low-fidelity level to unblock Sprint 1's high-fidelity design work.

### Frontend

- Repository setup (per the repository strategy decided in `08-GIT-GITHUB-STANDARD.md` §4).
- Application foundation and tooling (build system, linting, testing framework).
- Initial component architecture (aligned with the design token structure from UI/UX).
- Environment setup (dev/test/staging config, per `07-API-SPECIFICATION.md` §7).
- API client foundation (the shared layer that will consume Backend's API, ready to point at a mock or the real API as it becomes available).

### Backend

- Repository setup.
- Backend foundation (project structure, following `03-BACKEND-TEAM.md` §15's recommended layout).
- Database connection and migration tooling setup (per `06-DATABASE-ARCHITECTURE.md`).
- API foundation — shared validation, error-handling, and response-envelope middleware (per `07-API-SPECIFICATION.md` §13–15), built once and reused by every module rather than reimplemented per module.
- Authentication architecture groundwork (the mechanism itself remains `TBD` per `05-SYSTEM-ARCHITECTURE.md` §12, but the surrounding scaffolding — where credentials are validated, where sessions/tokens will be issued — is set up).

### Full Stack

- Define the integration strategy — how Frontend and Backend work will be verified together as both come online.
- End-to-end architecture validation — sanity-check that the Sprint 0 decisions from Frontend and Backend actually fit together before Sprint 1 work begins on top of them.
- Developer tooling — anything that makes local end-to-end development easier for every team (e.g., a way to run Frontend against a local Backend instance).
- Cross-team integration planning — identify, ahead of time, where Sprint 1's UI/UX → Frontend → Backend → Full-Stack handoffs (§24) will occur, so they aren't discovered mid-sprint.

---

## 21. Sprint Ceremony Process

**Before the sprint:**

- Backlog Refinement has already produced a set of Ready Stories (§14) for the upcoming sprint.
- UI/UX has already committed, one sprint prior (§4), to having relevant designs ready.

**During the sprint:**

- Sprint Planning (§16) opens the sprint with a committed goal and task breakdown.
- Daily Stand-ups (§22) run throughout.
- Blockers are raised and tracked as they occur (§23), not saved for stand-up if they're urgent.
- Cross-team handoffs (§24) happen as their preconditions are met, not batched to the end of the sprint.
- Code review and PRs flow continuously (`08-GIT-GITHUB-STANDARD.md` §9–10), not all at once near the sprint's end.

**After the sprint:**

- Sprint Review (§25) demonstrates what's actually Done (§15).
- Sprint Retrospective (§26) captures process improvements.
- Sprint Reporting (§30) captures the record of what happened.
- Unfinished Stories return to the backlog, re-prioritized in the next Refinement — not silently carried over as an assumed commitment.

---

## 22. Daily Stand-up Format

Each team member answers, briefly:

1. What did I complete (since the last stand-up)?
2. What will I work on next?
3. Am I blocked?

**Stand-up is not a long technical meeting.** Detailed problem-solving, design debate, or architecture discussion is taken offline into a smaller follow-up conversation, not conducted in front of the whole team during stand-up. Ten to fifteen minutes per team is the target; a stand-up that regularly runs long is a signal to move detailed discussion elsewhere, not a signal to schedule more time for it.

---

## 23. Blocker Management

```text
Blocked
   ↓
Identify blocker (what, specifically, is stopping progress)
   ↓
Document blocker (as a comment/status on the relevant Issue, per 08-GIT-GITHUB-STANDARD.md §12, §14's status:blocked label)
   ↓
Notify owner (the person/team who can actually resolve it)
   ↓
Escalate if necessary (to the relevant Team Lead, then Project/Product Manager, if unresolved within a working day)
   ↓
Resolve
   ↓
Continue work
```

A blocker is raised the moment it's identified — not held until the next stand-up — if it's actively stopping progress. Stand-up is where blockers are *surfaced for visibility*, not necessarily where they're first reported.

---

## 24. Cross-Team Handoff

### UI/UX → Frontend

Must include:

- Approved design (per `01-UI-UX-TEAM.md` §19's Definition of Done).
- Components (specs for any new or modified component).
- States (default, loading, empty, error — per `05-SYSTEM-ARCHITECTURE.md` §15's four-state requirement).
- Responsive behavior.
- Assets (exported per `01-UI-UX-TEAM.md` §14's `design-assets` repository).
- Interaction rules (what happens on click, hover, focus, validation failure).

### Backend → Frontend

Must include:

- API contract (per `07-API-SPECIFICATION.md` §31's documentation requirements).
- Authentication requirements.
- Request shape.
- Response shape (per `07-API-SPECIFICATION.md` §13).
- Error format (per `07-API-SPECIFICATION.md` §14).
- Permissions required (per `07-API-SPECIFICATION.md` §17).

### Frontend/Backend → Full Stack

Must include:

- Completed components (Frontend) and API readiness (Backend).
- Integration notes — anything non-obvious about how the pieces are meant to fit together.
- Known limitations — what's deliberately deferred or not yet handled, so Full-Stack doesn't discover a gap by surprise during integration.

A handoff is considered to have happened only when the receiving team confirms they have what they need — not merely when the sending team believes they've provided it. This is enforced in practice by each item above being attached to the relevant Issue (`08-GIT-GITHUB-STANDARD.md` §12), not communicated only verbally.

---

## 25. Sprint Review

**Focus on:**

- Working software — a real, running increment, not a slide deck describing what was built.
- Completed acceptance criteria — walked through explicitly against what was defined in Planning (§12, §16).
- Reusable capability — where relevant, a demonstration that a module works the way a *second* future client's configuration would need it to, not just the way the immediate scenario happened to be tested.
- Known limitations — what's intentionally out of scope or deferred, stated plainly.
- Feedback — collected from Product and any other stakeholders present, feeding directly into the next Refinement (§6).

**Avoid presenting unfinished work as complete.** A Story that doesn't meet the Definition of Done (§15) is not demoed as if it does — it's either shown explicitly as in-progress, with what remains, or not shown as a completed item at all. Sprint Review's value depends entirely on "Done" meaning the same thing every sprint; padding the review with near-done work erodes that.

---

## 26. Retrospective

```text
What went well?
   ↓
What did not go well?
   ↓
What should change?
   ↓
Action items
```

- **What went well?** — captured so it's deliberately repeated, not just felt good about once.
- **What did not go well?** — captured honestly; the Scrum Master/Agile Facilitator (§5) is responsible for keeping this constructive rather than accusatory.
- **What should change?** — specific, not vague ("communicate more" is not actionable; "Backend posts API contract drafts to the shared channel before Refinement, not after" is).
- **Action items** — each one is assigned an owner and, where it represents real work, entered as a Task/Issue (`08-GIT-GITHUB-STANDARD.md` §12) so it's tracked exactly like any other commitment, not lost the moment the meeting ends.

Retrospective action items are reviewed at the start of the *next* retrospective — did the change actually happen, and did it help — closing the loop rather than generating a fresh, disconnected list every two weeks.

---

## 27. Velocity

Velocity — the amount of estimated work (story points, §13) a team completes per sprint — is useful for exactly one thing: **team-level planning and forecasting.** It lets the team say, with reasonable confidence, "we typically complete about this much work in a sprint," which makes Sprint Planning (§16) realistic rather than aspirational.

**Velocity is never used as an individual performance metric.** It is a team-level, historically-averaged number, sensitive to Story size variance, team composition changes, and the inherent uncertainty in estimation (§13) — using it to compare individuals, or even to compare one team's velocity number directly against another team's (since story points are not calibrated across teams), is a misuse that produces both bad incentives and bad data. Velocity trends over several sprints are useful signal; a single sprint's velocity number is not.

---

## 28. Technical Debt

Tracked the same way as any other backlog item (§8's dedicated Technical Debt area), covering:

- Refactoring needed to keep a module maintainable as it grows.
- Missing tests identified after the fact.
- Temporary architecture or workarounds adopted under time pressure, with the intended follow-up noted at the time they're introduced.
- Outdated dependencies (`08-GIT-GITHUB-STANDARD.md` §26).
- Documentation gaps.

**Prioritization process:** technical debt is reviewed during Backlog Refinement (§6) alongside feature work, not relegated to a separate, perpetually-deprioritized backlog. A piece of technical debt that measurably increases the risk or cost of upcoming Feature work (e.g., debt in a module the next several sprints' Features depend on) is prioritized accordingly (§10) — technical debt priority is set by its actual impact on near-term work, not treated as uniformly low-priority by category.

---

## 29. Bug Management

| Severity | Meaning | Example |
|---|---|---|
| **Critical** | Data loss, security vulnerability, or complete inability to use a core function; cross-tenant data leakage (per `07-API-SPECIFICATION.md` §18) is always Critical | A user can view another organization's Customer records |
| **High** | A major function is broken or significantly degraded, with no reasonable workaround | Login fails for a subset of users |
| **Medium** | A function is impaired but a workaround exists, or the impact is limited to a non-critical path | A filter on the Customer list doesn't apply correctly |
| **Low** | Cosmetic or minor annoyance with negligible functional impact | A misaligned icon on a settings page |

**Severity vs. Priority:** severity describes *impact*; priority (§10) describes *when it gets worked on*. A Critical-severity bug is essentially always `P0`; a Low-severity bug might still be `P1` if it affects a highly visible screen right before a client demo — the two are related but not identical, and both are set deliberately, not derived from a fixed formula.

**Process:**

```text
Bug reported (per 08-GIT-GITHUB-STANDARD.md §32's Bug Report template)
   ↓
Severity assigned
   ↓
Priority assigned (§10)
   ↓
Assignment (to the owning team, per the module affected)
   ↓
Fix (branch/PR per 08-GIT-GITHUB-STANDARD.md §7–9)
   ↓
Testing (including a regression test that would have caught it)
   ↓
Regression check (verify the fix doesn't reintroduce a previously-fixed issue nearby)
   ↓
Release (per 08-GIT-GITHUB-STANDARD.md §20, or immediately via hotfix for Critical severity)
```

Critical bugs bypass normal sprint planning and are addressed via the `hotfix/*` path (`08-GIT-GITHUB-STANDARD.md` §6) regardless of what else is in progress.

---

## 30. Sprint Reporting

At the end of each sprint, a short report captures:

- **Sprint goal** — stated, and whether it was met.
- **Completed Stories** — what actually reached Done (§15).
- **Incomplete Stories** — what didn't, and why (returned to backlog for re-prioritization).
- **Bugs** — new bugs found, existing bugs fixed, by severity (§29).
- **Risks** — anything newly identified that could affect upcoming sprints (cross-referenced against `00-PROJECT-OVERVIEW.md` §35's risk register where relevant).
- **Blockers** — what blocked progress this sprint, and how it was (or wasn't) resolved (§23).
- **Technical debt** — new debt incurred, existing debt paid down (§28).
- **Reusable modules completed** — specifically called out, since this is the metric that most directly reflects `00-PROJECT-OVERVIEW.md`'s core business objective (§6: "increase the proportion of each new client project delivered through reuse").
- **Next sprint focus** — a preview, not a formal commitment (that happens at the next Sprint Planning, §16).

---

## 31. Release Planning

```text
Sprint → Increment → Release Candidate → Testing → Release
```

- Each sprint produces a working **increment** — not necessarily a public release.
- A **Release Candidate** is cut (via `release/*`, per `08-GIT-GITHUB-STANDARD.md` §20) when a meaningful, coherent set of increments is ready to move toward production — this may span multiple sprints' worth of increments, especially early on, or may happen every sprint once the platform matures.
- **Not every sprint produces a public production release** — Sprint Review (§25) demonstrates working software in whatever environment is appropriate (development/staging), which is a separate thing from a Release Candidate reaching production.
- Testing and the promotion path to Staging/Production follow `08-GIT-GITHUB-STANDARD.md` §20 and `07-API-SPECIFICATION.md` §7's environment model.

---

## 32. MVP Tracking

```text
New Requirement
   ↓
Backlog (added, not immediately actioned)
   ↓
Prioritization (Product Owner, against existing MVP scope — 00-PROJECT-OVERVIEW.md §17–18)
   ↓
Impact Analysis (does this belong in MVP, or does it push against MVP Non-Scope, §18 of 00-PROJECT-OVERVIEW.md?)
   ↓
Sprint Planning (only pulled into a sprint through the normal process, §16)
```

**New work is never silently added to an active sprint.** A mid-sprint request — however urgent it feels — goes through this flow; the only exception is a Critical-severity bug (§29), which has its own explicit hotfix path precisely because it's a defect in already-committed work, not new scope. This is the direct operational enforcement of `00-PROJECT-OVERVIEW.md` §35's named risk, "over-engineering the Core before real usage validates it," and its stated mitigation, "build MVP scope only."

---

## 33. Client Request Management

```text
Customer Request
   ↓
Requirement Analysis
   ↓
Classification (per 00-PROJECT-OVERVIEW.md §13):
   Is it Core?
   Is it Reusable?
   Is it Industry-specific?
   Is it Client-specific?
   ↓
Backlog (added to the appropriate area, §8)
   ↓
Prioritization (§10, weighed against existing roadmap — 00-PROJECT-OVERVIEW.md §19)
   ↓
Development (following the normal Agile process in this document, and 08-GIT-GITHUB-STANDARD.md §30's Client Customization Rules)
```

This flow is what stands between AXIVON ONE and the exact failure mode `00-PROJECT-OVERVIEW.md` §35 names as a top risk: **"uncontrolled client customization forking the core."** No customer request skips Classification — even an urgent one — because skipping it is precisely how client-specific logic ends up hardcoded into Core or Reusable Module code (`08-GIT-GITHUB-STANDARD.md` §30). A request classified as genuinely Client-specific is still delivered, just through the Client Customization path rather than by modifying shared code.

---

## 34. Module Maturity

```text
Idea → Planned → Design → Development → Testing → Stable → Reusable → Versioned → Deprecated
```

| Stage | Meaning |
|---|---|
| Idea | Identified as a candidate module, not yet scoped |
| Planned | Classified (`00-PROJECT-OVERVIEW.md` §13) and placed in the roadmap (`00-PROJECT-OVERVIEW.md` §19) |
| Design | UI/UX and/or API contract design underway |
| Development | Actively being implemented across the relevant teams |
| Testing | Implementation complete; undergoing the testing required by the Definition of Done (§15) |
| Stable | Meets its Definition of Done; working correctly for its original/first use case |
| **Reusable** | Has been used, unmodified beyond configuration, by a **second** distinct context (a second client engagement, or a second Industry Module depending on it) — this is the concrete, checkable bar for calling a module "reusable" rather than just "built" |
| Versioned | Has a stable, documented contract (`08-GIT-GITHUB-STANDARD.md` §29) that other modules can safely depend on |
| Deprecated | Superseded; on a documented migration path to removal (`07-API-SPECIFICATION.md` §34, `08-GIT-GITHUB-STANDARD.md` §34 concept extended to modules) |

**What makes a module officially "Reusable"** is not a subjective judgment — it's the concrete event of a second, independent consumer using it through configuration alone, with no code fork. Until that's happened, a module is honestly "Stable," not "Reusable," even if it was *designed* to be reusable — the distinction matters because `00-PROJECT-OVERVIEW.md` §34's success criteria explicitly measure reuse actually happening, not just being architecturally possible.

---

## 35. Agile Quality Gates

| Gate | Must Be True to Proceed |
|---|---|
| **Requirement Gate** | The Story meets the Definition of Ready (§14); Product Owner has confirmed priority and business value |
| **Design Gate** | For user-facing work: design meets `01-UI-UX-TEAM.md` §19's Definition of Done and has been approved |
| **Technical Gate** | Any significant technical uncertainty or architectural risk has been resolved or explicitly scoped as a spike; relevant `TBD` decisions this Story depends on have been made |
| **Development Gate** | Implementation meets the relevant team's Definition of Done (`01`–`04`); code review complete (`08-GIT-GITHUB-STANDARD.md` §10) |
| **Testing Gate** | All required test levels pass (unit, integration, end-to-end where applicable); no new Critical/High severity bugs (§29) introduced |
| **Release Gate** | The increment meets the project-wide Definition of Done (§15); Release Candidate has passed through Testing/Staging (§31, `08-GIT-GITHUB-STANDARD.md` §20) |

A Story does not skip a gate because the team is confident it would pass — each gate is a checked, not assumed, condition, matching the checklist-driven approach used throughout this documentation series.

---

## 36. Project Health Metrics

| Metric | What It Tells You |
|---|---|
| Sprint goal success rate | Whether Planning (§16) is realistically sized against actual team capacity |
| Lead time (idea → delivered) | How long it takes a requirement to become working software, end-to-end |
| Cycle time (started → done) | How efficiently in-progress work moves through the pipeline once started |
| Defect rate | How much new work is generating bugs, by severity (§29) |
| Rework | How often "Done" work has to be revisited — a signal about Definition of Done rigor (§15) or requirement clarity (§14) |
| Blocked time | How much time work spends blocked (§23), and on what — surfaces recurring cross-team friction |
| Deployment frequency (once applicable) | How often working increments actually reach production (§31) |
| Module reuse | The concrete count of modules that have reached "Reusable" maturity (§34) — the most direct measure of `00-PROJECT-OVERVIEW.md`'s core business objective |
| Technical debt trend | Whether tracked debt (§28) is growing, shrinking, or holding steady relative to feature delivery |

**Avoid vanity metrics** — raw story-point totals, raw commit counts, or lines of code convey activity, not outcomes, and are explicitly not used here; every metric above is chosen because it answers a specific planning or health question, not because it's easy to count.

---

## 37. Agile Checklist

### Before Sprint

- [ ] Backlog refined (§6)
- [ ] Sprint goal defined (§16)
- [ ] Dependencies identified (§17)
- [ ] Capacity understood (per team, per §19's allocation approach)
- [ ] Stories ready (§14)

### During Sprint

- [ ] Daily stand-up (§22)
- [ ] Blockers tracked (§23)
- [ ] Cross-team coordination (§4, §24)
- [ ] PR reviews (`08-GIT-GITHUB-STANDARD.md` §10)
- [ ] Testing (ongoing, not deferred to the sprint's last day)

### End of Sprint

- [ ] Sprint review (§25)
- [ ] Acceptance criteria verified (§12, §15)
- [ ] Documentation updated (§15)
- [ ] Retrospective (§26)
- [ ] Next actions recorded (§26, §30)

---

## 38. Common Agile Mistakes

- Overloading sprints — committing to more than the team's demonstrated velocity (§27) supports, "because it should be quick."
- Starting unclear Stories — pulling something into a sprint that doesn't actually meet the Definition of Ready (§14), then discovering the gap mid-sprint.
- Ignoring dependencies — planning a Frontend Task without confirming the Backend contract it needs is actually agreed (§17).
- Treating story points as hours — converting a 5-point Story into "this should take 5 hours" or similar (§13).
- Using velocity to judge individuals — the single most damaging misuse of an otherwise useful planning number (§27).
- Skipping retrospectives — "we're busy this sprint" is exactly when the retrospective is most needed, not least.
- Allowing constant scope changes — pulling new work into an active sprint outside the hotfix path (§29), quietly eroding the sprint goal (§32).
- Calling unfinished work done — presenting a Story as Done when it doesn't meet §15's checklist, which corrodes the meaning of "Done" for every future sprint.
- Building too many modules simultaneously — spreading four teams thin across parallel Epics instead of sequencing per the roadmap (§18), reintroducing the "scope creep into industry modules too early" risk `00-PROJECT-OVERVIEW.md` §35 names.
- Ignoring technical debt — letting §28's backlog area sit permanently deprioritized until it becomes a crisis.

---

## 39. Governance

| Decision Area | Owner (Role) |
|---|---|
| Product backlog content and priority order | Product Owner |
| Sprint priority / sprint goal | Product Owner, with the four Team Leads at Sprint Planning (§16) |
| Architecture | Architecture/Technical Lead (per `00-PROJECT-OVERVIEW.md` §36) |
| Team process (ceremonies, estimation method, sprint length) | Engineering Manager, with input from the Scrum Master/Agile Facilitator and all four Team Leads |
| Definition of Ready / Definition of Done (project-wide, §14–15) | Engineering Manager, with all four Team Leads |
| Release decisions | Engineering Manager (per `00-PROJECT-OVERVIEW.md` §36) |

This mirrors `00-PROJECT-OVERVIEW.md` §36's Project Governance table exactly — no new decision-ownership pattern is introduced here that conflicts with it. Role titles only; no individuals are named.

---

## 40. Final Agile Principles

1. Deliver working software incrementally — every sprint produces something real, not just progress notes.
2. Keep sprint goals clear — one goal, understood by all four teams, per sprint.
3. Make dependencies visible — an undocumented dependency is treated as an unmanaged risk.
4. Design before implementation where needed — UI/UX's one-sprint-ahead model exists precisely so Frontend never builds against an unfinished design.
5. Build reusable modules — every Feature is built with its second future consumer in mind, not just its first.
6. Protect the core architecture — Client Customization never forks Core or Reusable Module code (`08-GIT-GITHUB-STANDARD.md` §30).
7. Keep scope controlled — new requirements go through Classification and Prioritization (§32–33), never straight into an active sprint.
8. Test continuously — testing happens throughout the sprint, not crammed into its final days.
9. Document important decisions — undocumented decisions are, in practice, lost decisions.
10. Improve the process every sprint — the Retrospective (§26) exists to be used, not performed.
11. Do not sacrifice quality for artificial speed — the Definition of Done (§15) is not negotiable under deadline pressure.
12. Treat security as part of development — not a separate phase or a separate team's problem (§15, §29's Critical severity for tenant-isolation issues).
13. Do not use metrics to create unhealthy competition — velocity (§27) and every metric in §36 measure the system, not individuals.
14. Prioritize customer value — but through the Classification process (§33), never by shortcutting it under urgency.
15. Keep the platform maintainable — every sprint's work should make the next sprint easier, not harder, per `00-PROJECT-OVERVIEW.md` §4's "faster for future delivery" mission.
