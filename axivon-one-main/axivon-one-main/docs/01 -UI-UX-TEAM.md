# 01-UI-UX-TEAM.md

## 1. Document Information

| Field | Value |
|---|---|
| Project Name | AXIVON ONE — Modular Business & Management Platform |
| Team Name | UI/UX Design Team |
| Document Purpose | Defines mission, scope, workflow, and standards for the UI/UX team within AXIVON ONE |
| Document Version | 1.0 |
| Status | Draft — Living Document |
| Owner | UI/UX Lead |
| Audience | UI/UX Designers, Frontend Team, Product Management, Engineering Leadership |
| Last Updated | TBD — set on first commit to repository |
| Related Teams | Frontend Team, Backend Team, Full-Stack Team |

---

## 2. Team Mission

The UI/UX Team exists to design a **single, coherent, reusable design language** for AXIVON ONE — one that works across every future client, industry, and module, without being redesigned from scratch each time.

**What the team owns:**
- The AXIVON design system (tokens, components, patterns, states)
- Information architecture and navigation models for Core, Reusable, and Industry modules
- User research, personas, and journey mapping for platform users (admins, staff, end customers)
- Wireframes and high-fidelity UI for every module before development starts
- Accessibility standards and design QA against implemented UI

**What the team does not own:**
- Frontend code implementation (owned by Frontend Team)
- Business logic or data validation rules (owned by Backend Team)
- Final technology stack decisions (owned by Architecture/Technical Lead)
- API contracts (owned by Backend Team, consulted with Frontend/Full-Stack)

**Why this matters:** Every hour spent designing a one-off screen for a single client is an hour not spent on a reusable pattern. If the design system is solid, onboarding a new client industry (e.g., Hotel after Education) becomes a configuration exercise, not a redesign exercise.

**Contribution to reusable client projects:** The design system, components, and IA patterns produced here are versioned and reused across every client configuration — only branding tokens (logo, color, typography scale within brand limits) change per client.

---

## 3. Team Structure

Roles are responsibilities, not necessarily headcount. In a small team, one person may hold multiple roles.

| Role | Core Responsibility | Can Be Combined With |
|---|---|---|
| UI/UX Lead | Design direction, design system ownership, stakeholder alignment | Senior UX Designer |
| UX Designer | Research, IA, user flows, wireframes | UI Designer (in small teams) |
| UI Designer | High-fidelity visuals, design tokens, component visuals | UX Designer |
| Design System Designer | Maintains component library, tokens, documentation | UI/UX Lead (in small teams) |
| UX Researcher | User interviews, usability testing, validation | UX Designer (part-time role) |
| Design QA | Verifies shipped UI matches design intent | Any designer, rotated per sprint |

For a small initial team (2–3 people), recommended split: one person leads system + UI, one person leads research + flows + QA.

---

## 4. Responsibility Matrix

| Area | Primary Owner | Supporting Team | Responsibility |
|---|---|---|---|
| Requirements | Product Management | UI/UX | Translate business need into design brief |
| UX | UI/UX | — | User flows, IA, journeys |
| UI | UI/UX | — | Visual design, design system |
| Design System | UI/UX | Frontend | Tokens, components, documented specs |
| Frontend | Frontend | UI/UX (consulted) | Implementation of designs |
| Backend | Backend | — | Not applicable to this team |
| Database | Backend | — | Not applicable to this team |
| API | Backend | Frontend (consulted) | Not applicable to this team |
| Authentication (UX) | UI/UX | Frontend | Login/registration flow design |
| Business Logic | Backend | — | Not applicable to this team |
| Integrations (UX) | UI/UX | Frontend | UX for third-party touchpoints |
| Testing | Design QA | Frontend | Visual/UX regression, usability testing |
| Documentation | UI/UX | — | Design system docs, handoff specs |
| Deployment | Frontend/DevOps | — | Not applicable to this team |
| Code Review | Frontend | — | Not applicable to this team |
| Design Review | UI/UX Lead | Product | Approve designs before handoff |
| Security | Backend | — | Not applicable (UX only advises on secure-feeling patterns) |
| Performance | Frontend | UI/UX (consulted on image/asset weight) | Shared |
| Accessibility | UI/UX | Frontend (implementation) | WCAG-compliant design specs |
| Client Customization | UI/UX | — | Defines which tokens are brand-configurable |

---

## 5. AXIVON ONE Architecture Understanding

```text
AXIVON ONE
│
├── Core (Auth, Users, Roles, Org/Tenant, Dashboard shell, Notifications, Files, Settings, Audit, Search)
├── Shared Services (cross-cutting APIs and utilities)
├── Reusable Modules (CRM, Employee, Task, Project, Product, Service, Billing, Payment, Reporting)
├── Industry Modules (Education, Hospital, Restaurant, Hotel, E-Commerce, Retail, Coaching, ...)
└── Client Configuration (branding, enabled modules, roles, business rules)
```

The UI/UX team contributes design artifacts to **every layer**:
- **Core**: the shell — navigation, layout grid, auth screens, dashboard framework, settings UI
- **Shared Services**: notification UI patterns, file upload/preview patterns, search UI
- **Reusable Modules**: list/detail/form patterns for CRM, Tasks, Projects, etc.
- **Industry Modules**: industry-specific screens built from the same component library
- **Client Configuration**: the token layer that lets branding vary without new design work

---

## 6. Team Module Ownership

| Module | Purpose | Team Responsibility | Dependencies | Deliverables | Reusability Requirement | Completion Criteria |
|---|---|---|---|---|---|---|
| Design System | Single source of visual truth | Full ownership | None | Figma library, token docs | Must work for all industries via tokens only | Adopted by Frontend, zero one-off components |
| Core Shell (Nav, Layout, Dashboard) | App skeleton | Full ownership | Design System | Wireframes + high-fi | Must support module add/remove without redesign | Frontend builds without clarification |
| Auth Flows | Login/registration/reset UX | Full ownership | Design System | Flow + high-fi screens | Same flow works for every client | Usability-tested |
| Reusable Business Module UI (CRM, Tasks, etc.) | List/detail/form patterns | Full ownership | Design System, Core Shell | Pattern library + per-module high-fi | One pattern set reused across modules | Frontend confirms no duplicate patterns needed |
| Industry Module UI | Screens per vertical | Full ownership (post-MVP) | Reusable patterns | High-fi per module | Built from existing components, minimal net-new | Design QA sign-off |

---

## 7–8. Detailed & Core Module Breakdown (Design Perspective)

### Module: Authentication (Core)

**Purpose:** Secure, low-friction entry point reused by every client.

**Features:** Login, registration, logout confirmation, forgot/reset password, email verification state, OTP screen (if enabled), session-expired state.

**User Roles:** Platform Admin, Org Admin, Staff, End Customer (role visibility depends on client configuration).

**User Flows:** Standard login → dashboard; failed login → inline error; forgot password → email sent state → reset form → success state.

**UI Requirements:** Single auth layout template; branding tokens (logo, primary color) swappable per client; no hardcoded client copy.

**Frontend Requirements:** Form validation states must map to backend-provided error codes (see Backend doc §Auth API).

**Backend Requirements:** N/A for this team — coordinate with Backend Team for error/state contract.

**Database Requirements:** N/A for this team.

**API Requirements:** UI/UX documents expected states (loading, error, success) for Frontend to map to API responses.

**Integration Requirements:** OTP/SMS provider is TBD — design must accommodate an OTP step as an optional flow branch.

**Security Requirements:** Design must not expose whether an email exists in error states (generic "invalid credentials" messaging).

**Testing Requirements:** Usability test on first release; accessibility audit (contrast, keyboard nav, screen reader labels).

**Documentation Requirements:** Annotated Figma with all states (default, loading, error, success, disabled).

**Reusability Requirement:** No client-specific text hardcoded into the design file; all copy referenced as configurable strings.

**Definition of Done:** All states designed, annotated, accessibility-checked, and approved by UI/UX Lead + Product.

*(The same breakdown structure applies to User Management, Role & Permission Management, Organization/Tenant Management, Dashboard, Notifications, File Management, Settings, and Audit Logs. Each must be designed as a configurable pattern, not a one-off screen. Full per-module specs are maintained in the Figma workspace, not duplicated in this document, to avoid drift between design source-of-truth and documentation.)*

---

## 9. Business Modules — UX Focus

For CRM, Employee Management, Task Management, Project Management, Product Management, Service Management, Billing, Payment, and Reporting, the UI/UX team applies **one shared UX pattern set**:

| Pattern | Reused Across |
|---|---|
| List view (filter, search, sort, pagination) | Every module with collections (leads, tasks, employees, products...) |
| Detail/Record view | Every module with a single-entity view |
| Create/Edit form | Every module with data entry |
| Empty state | Every list/collection view |
| Bulk action pattern | Any module needing multi-select actions |

This is the central reusability lever: designing **one pattern that flexes via configuration** (columns, fields, filters) rather than one screen per module.

---

## 10. Industry Module Readiness

The UI/UX team will not design full industry modules pre-emptively. Instead:

- **Build first:** Core shell + Reusable Business Module patterns (list/detail/form/dashboard)
- **Architecturally prepared:** Component library flexible enough to add industry-specific fields/screens without new base patterns
- **Future scope:** Full high-fidelity screens for Education, Hospital, Restaurant, Hotel, E-Commerce — designed only once a client contract requires that industry

---

## 11. Reusability Rules

- Never hardcode one client's branding (logo, colors, copy) directly into component master styles — use design tokens.
- Never create a new component without first checking the design system library for an existing pattern.
- Document every new component's intended reuse scope before building it in Figma.
- Keep every module's design file independently understandable (a new designer should not need three other files open to understand one module).
- Version the design system (e.g., v1.0, v1.1) and note breaking changes.
- Maintain a change log for token/component updates so Frontend can track what changed.

---

## 12. Team Workflow

```text
Requirement (from Product)
↓
UX Analysis (flows, IA, edge cases)
↓
Wireframes (low-fi)
↓
Design Review (internal)
↓
High-Fidelity UI (design system components only)
↓
Prototype (if needed for validation)
↓
Developer Handoff (annotated specs, tokens, assets)
↓
Design QA (against implemented Frontend)
↓
Documentation Update
```

At each stage: Analysis defines scope and roles; Wireframes validate flow logic before visual investment; High-Fi applies the design system strictly; Handoff includes redlines, spacing, states, and asset exports; Design QA is a mandatory checklist review post-implementation, not optional polish.

---

## 13. Cross-Team Handoff

```text
UI/UX
↓ (Design Handoff: Figma link, component specs, states, tokens, copy, accessibility notes)
Frontend
↓ (Implementation)
Backend
↓ (API contract, data shape)
Full Stack
↓ (Integration for complex/cross-cutting modules)
QA / Release
```

**Handoff Checklist (UI/UX → Frontend):**
- [ ] All screen states designed (default, loading, empty, error, success)
- [ ] Components mapped to existing design system entries (or flagged as new)
- [ ] Spacing, typography, color tokens documented
- [ ] Responsive behavior specified (mobile/tablet/desktop)
- [ ] Accessibility notes included (labels, focus order, contrast)
- [ ] Copy finalized (no lorem ipsum in final handoff)
- [ ] Assets exported in required formats

---

## 14. Git & GitHub Workflow

Design assets live primarily in Figma, not Git. However, design tokens, exported assets, and documentation are version-controlled.

**Repository structure (design-assets repo):**
```text
design-system/
├── tokens/          # JSON/CSS token exports
├── assets/          # icons, illustrations
├── docs/            # component specs, changelog
└── README.md
```

**Branch strategy:** Trunk-based with short-lived feature branches (`feature/design-token-update-v1.2`) merged via PR into `main`. Git Flow is unnecessary here — token/asset changes are low-frequency and low-conflict, so a simpler trunk-based approach avoids overhead.

**PR rules:** Any token or component export change requires review by UI/UX Lead and a ping to Frontend Lead (they consume these files).

**Commit convention:** `design(tokens): update primary color scale`, `design(assets): add invoice icon set`.

**Release tags:** Tag design system versions (`design-v1.0.0`) matching what Frontend has implemented against.

---

## 15. Task Management

```text
Epic: AXIVON Design System v1
↓
Feature: Core Shell Navigation Pattern
↓
User Story: As an Org Admin, I need a collapsible sidebar so I can navigate modules efficiently
↓
Task: Design collapsible sidebar states (expanded/collapsed/hover)
↓
Sub-task: Export icon set for sidebar nav items
```

---

## 16. Agile Development

The UI/UX team participates fully in Agile, typically **one sprint ahead** of Frontend so designs are ready before development starts.

- **Product backlog:** Design tasks entered as issues linked to the parent Epic/Feature
- **Sprint planning:** UI/UX commits to design tasks needed for the *next* sprint's development, not the current one
- **Sprint goal:** e.g., "Finalize Core Shell high-fidelity design + handoff"
- **Daily stand-up:** Blockers on requirement clarity or pending Product decisions
- **Refinement:** UI/UX joins backlog refinement to flag design complexity early
- **Review:** Demo designs (not code) to Product and Frontend
- **Retrospective:** Full team, including handoff friction points

**Coordination:** UI/UX works one sprint ahead of Frontend; Backend and Full-Stack are informed of UX changes affecting data shape (e.g., new required fields) during refinement.

---

## 17. Sprint Planning (Recommended Baseline)

| Sprint | UI/UX Focus |
|---|---|
| Sprint 0 | Design system foundation: tokens, typography, color, spacing scale, Figma structure |
| Sprint 1 | Auth flow design, base component library (buttons, inputs, cards) |
| Sprint 2 | User management, roles/permissions UI patterns |
| Sprint 3 | Organization/Tenant UX, Dashboard shell design |
| Sprint 4 | Notifications, File management, Settings UI |
| Sprint 5+ | Reusable business module patterns (list/detail/form), then industry modules as contracted |

This is a baseline only — adjust based on actual team capacity and Product priorities.

---

## 18. Definition of Ready (UI/UX)

- [ ] User story exists and is understood
- [ ] User flow / use case understood
- [ ] Requirements reviewed with Product
- [ ] Edge cases identified (empty, error, permission-denied states)
- [ ] Existing design system checked for reusable components

## 19. Definition of Done (UI/UX)

- [ ] All UI states designed
- [ ] Design system compliance verified (no unauthorized one-offs)
- [ ] Accessibility reviewed (contrast, focus order, labels)
- [ ] Responsive behavior specified
- [ ] Handoff documentation complete
- [ ] Reviewed and approved by UI/UX Lead
- [ ] Design QA passed against implemented Frontend

---

## 20. Quality Standards

- **Consistency:** No screen ships with a component outside the design system without documented exception.
- **Accessibility:** WCAG 2.1 AA as the target baseline.
- **Responsive design:** Every screen designed for mobile, tablet, and desktop breakpoints.
- **Design system compliance:** Enforced via Design QA checklist.
- **Usability:** Validated via lightweight usability testing before major releases.

---

## 21. Security Requirements (UX-Relevant)

- Design error states that do not leak sensitive information (e.g., account existence).
- Avoid UI patterns that encourage insecure behavior (e.g., visible password fields by default without user toggle).
- Session-expiry and permission-denied states must be clearly designed, not left to developer improvisation.

---

## 22. Testing Strategy (UI/UX Scope)

| Test Type | Owner |
|---|---|
| Usability testing | UI/UX |
| Accessibility testing (design-level) | UI/UX |
| Visual regression | Design QA + Frontend |
| UI implementation testing | Frontend (owns), UI/UX (verifies) |

---

## 23. Documentation Requirements

- Figma library README (structure, naming conventions)
- Component documentation (states, variants, usage rules)
- Design token documentation (JSON export + description)
- Handoff specs per module
- Change log per design system version
- Known limitations (e.g., "dark mode not yet designed")

---

## 24. Deliverables

**Phase 1 (MVP):** Design system foundation, Auth flows, Core Shell, Dashboard shell.
**Phase 2 (V1):** Reusable business module patterns (CRM, Tasks, Projects), Notifications, Settings, File Management UI.
**Phase 3 (V2):** First industry module UI (per first signed client), advanced dashboard widgets/charts.
**Future:** Additional industry modules, dark mode, advanced personalization UI.

---

## 25. Team Checklist

- [ ] Requirement understood
- [ ] Dependencies identified (design system components available?)
- [ ] Work assigned
- [ ] Design completed (all states)
- [ ] Internal design review completed
- [ ] Accessibility check completed
- [ ] Documentation completed
- [ ] Handoff to Frontend completed
- [ ] Design QA against build completed
- [ ] Definition of Done satisfied

---

## 26. Common Mistakes to Avoid

- Inconsistent components created without checking the design system first.
- Designing without understanding technical/data constraints (ask Backend/Frontend before assuming a field is free-form).
- Ignoring responsive/mobile states until late.
- Hardcoding client-specific branding into master components instead of tokens.
- Skipping empty/error/loading states, leaving Frontend to improvise.

---

## 27. Escalation Process

| Issue Type | Contact | Documentation |
|---|---|---|
| Requirement ambiguity | Product Management | Comment on linked issue |
| Design conflict with technical constraint | Frontend Lead / Architecture Lead | Design review note + issue |
| Deadline risk | UI/UX Lead → Engineering Manager | Sprint board flag |
| Accessibility issue found post-release | UI/UX Lead + Frontend Lead | Bug ticket, priority per severity |

---

## 28. Communication Rules

- Daily stand-up updates in team channel.
- Design decisions recorded as comments on the relevant GitHub issue or Figma file, not private chat.
- Cross-team questions posted in shared channel, tagging relevant lead.
- Escalations documented, never resolved verbally-only.

---

## 29. Performance & Scalability (Design Considerations)

- Design with asset weight in mind (optimized icon sets, avoid unnecessary large imagery in core flows).
- Avoid designing patterns that only work for small data sets (design pagination/virtualization-friendly list views from the start).
- Do not over-engineer visual complexity for edge cases that may never ship.

---

## 30. Client Customization Model

```text
AXIVON CORE (fixed layout, IA, component behavior)
+
REUSABLE MODULES (fixed patterns, configurable fields)
+
INDUSTRY MODULES (fixed patterns per vertical)
+
CLIENT CONFIGURATION (logo, color tokens, enabled modules, terminology)
+
CUSTOM FEATURES (rare, evaluated case by case)
=
CLIENT PROJECT
```

**Configurable:** Logo, primary/secondary brand colors (within accessibility-safe ranges), enabled modules/navigation items, terminology strings.
**Not configurable (core platform):** Layout grid, component structure/behavior, accessibility baseline, core interaction patterns.

---

## 31. Final Team Responsibility Summary

- **Owns:** Design system, IA, UX flows, high-fidelity UI, accessibility standards, design QA.
- **Contributes:** Reusable, documented design patterns usable across every client and industry.
- **Must deliver:** Fully annotated, state-complete designs before development begins.
- **Must never do:** Ship inconsistent one-off components; hardcode client branding into core files; skip accessibility review.
- **Success looks like:** A new client can be launched using existing components and token changes only — no net-new design work required for standard modules.

---

## Team Collaboration Matrix

| Activity | UI/UX | Frontend | Backend | Full Stack |
|---|---|---|---|---|
| Requirements | Secondary | Consulted | Consulted | Consulted |
| UX | Primary | Consulted | Informed | Informed |
| UI | Primary | Secondary | Informed | Informed |
| Architecture | Consulted | Secondary | Primary | Secondary |
| Database | Informed | Informed | Primary | Secondary |
| API | Informed | Secondary | Primary | Secondary |
| Implementation | Consulted | Primary | Primary | Primary |
| Testing | Secondary | Primary | Primary | Primary |
| Integration | Informed | Secondary | Secondary | Primary |
| Documentation | Primary | Secondary | Secondary | Secondary |
| Release | Informed | Secondary | Secondary | Primary |
