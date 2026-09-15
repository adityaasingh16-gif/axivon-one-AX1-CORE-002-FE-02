# 08-GIT-GITHUB-STANDARD.md

## 1. Document Information

| Field | Value |
|---|---|
| Project | AXIVON ONE — Modular Business & Digital Platform |
| Document | Git & GitHub Standard |
| Version | 1.0 |
| Status | Draft — Living Document |
| Owner | Engineering Manager (with Backend Lead and Architecture/Technical Lead) |
| Audience | UI/UX Team, Frontend Team, Backend Team, Full-Stack Team, Engineering Leadership |
| Purpose | Consolidates the Git/GitHub conventions already established individually in `01`–`04` into one authoritative, cross-team standard, and fills in the operational detail (issues, labels, boards, security, templates) those documents intentionally left to a shared standard |
| Related Documents | `00-PROJECT-OVERVIEW.md`, `01-UI-UX-TEAM.md`, `02-FRONTEND-TEAM.md`, `03-BACKEND-TEAM.md`, `04-FULL-STACK-TEAM.md`, `05-SYSTEM-ARCHITECTURE.md`, `06-DATABASE-ARCHITECTURE.md`, `07-API-SPECIFICATION.md`, `09-AGILE-SPRINT-PLAN.md` |
| Last Updated | TBD — set on first commit to repository |

This document does not introduce a new branching model, commit style, or PR/merge policy that conflicts with `01-UI-UX-TEAM.md` §14, `02-FRONTEND-TEAM.md` §14, `03-BACKEND-TEAM.md` §15, or `04-FULL-STACK-TEAM.md` §12 — those four sections already independently converged on the same model, and this document makes that convergence explicit and binding platform-wide, while resolving the few points those documents left open (notably repository strategy, §4). Decisions are labeled **Confirmed** (already established consistently across `01`–`04`), **Recommended** (proposed here, not yet ratified), **TBD** (genuinely open), or **Future**.

---

## 2. Purpose

AXIVON ONE is built by four teams working continuously on a shared, reusable codebase, not four independent projects that occasionally intersect. Per `00-PROJECT-OVERVIEW.md` §4 and §6, consistency and reduced duplication are explicit business objectives — and that has to hold in engineering process, not just in code and design. A centralized Git/GitHub standard exists because:

- **Collaboration** — four teams touching overlapping and adjacent code need one shared set of rules for how a change gets in, or coordination breaks down as the module catalog grows.
- **Version control** — every module, from Core through Industry, has a history that can be inspected, bisected, and reverted.
- **Code quality** — mandatory review and CI checks (§10, §17) catch problems before they reach `develop` or `main`, not after.
- **Design versioning** — design tokens and assets are versioned alongside the code that consumes them (§11), so Frontend never implements against a design that has silently moved on.
- **Safe experimentation** — short-lived branches (§6) let any team try something without risking the integration branch.
- **Code review** — a second set of eyes is mandatory, not optional, on every change (§10).
- **Traceability** — every branch, commit, and PR ties back to an issue (§7, §12), so "why was this changed" is always answerable from the repository itself.
- **Release management** — a predictable path from `develop` to `main` to production (§20) that the whole organization understands.
- **Team coordination** — the same conventions mean a Full-Stack developer moving between Frontend and Backend code, or a new hire joining any of the four teams, faces one standard, not four.
- **Long-term maintainability** — per `00-PROJECT-OVERVIEW.md` §40, "keep APIs and interfaces consistent across the entire platform" applies equally to how the platform's own history and process are kept consistent.

---

## 3. Git/GitHub Principles

1. Never work directly on `main` — production-facing history is only ever reached through a reviewed pull request.
2. Every meaningful change must be traceable to an issue (§12) and a PR (§9).
3. Pull requests are required for `develop` and `main` (§17) — no exceptions, no "quick fixes" pushed directly.
4. Code review is mandatory on every PR (§10) — a PR with zero reviewers cannot merge.
5. Small, focused changes are preferred over large, sprawling PRs — a PR should be reviewable in one sitting.
6. Commit history should remain understandable — commit messages describe *what* and *why*, not just restate a diff (§8).
7. Secrets must never be committed, under any circumstance, to any branch (§24).
8. Branches have clear ownership — the author who opens a branch is responsible for it until it is merged or closed.
9. Issues should describe work clearly enough that someone outside the immediate conversation could pick it up (§12).
10. Documentation changes are version-controlled the same as code changes — a documentation-only PR still goes through review.
11. Reusable modules must remain maintainable — a change to a Core or Reusable module is reviewed with its *other* consumers in mind, not just the current client engagement (per `00-PROJECT-OVERVIEW.md` §40).
12. Do not merge unfinished work into `develop` or `main` — partial work stays on its feature branch, or behind a feature flag if it must land incrementally (Future capability, once feature-flagging is adopted).
13. Resolve conflicts carefully — never blindly accept "theirs" or "ours" without understanding both sides (§19).
14. Keep repositories clean — stale branches are deleted after merge; unused dependencies are removed (§26).
15. Follow the same standards across all teams — the branch model, commit convention, and PR rules in this document apply identically to UI/UX, Frontend, Backend, and Full-Stack, exactly as `01`–`04` already independently describe.

---

## 4. Repository Strategy

`04-FULL-STACK-TEAM.md` §12 explicitly flags monorepo vs. polyrepo as **TBD — Architecture/Technical Lead to decide**. This document does not treat that as settled, but lays out the trade-offs so the decision can be made deliberately.

### Option A — Monorepo

All apps/services/packages in one repository.

| Advantages | Disadvantages |
|---|---|
| Atomic cross-cutting changes (e.g., an API contract change and its Frontend consumer land in one PR) | Requires more sophisticated CI (path-based builds/tests) to avoid running everything on every change |
| Single source of truth for shared code (design tokens, shared types, API contracts) | Larger repository; slower clone/checkout as it grows |
| Simpler dependency versioning between internal packages — no publish-and-consume cycle | Coarser access control — harder to restrict a contributor to only part of the codebase |
| Easier to enforce platform-wide conventions (this document's rules apply uniformly by construction) | A single point of CI/tooling failure can block unrelated teams |

### Option B — Multiple Repositories (Polyrepo)

Separate repositories per app/service (e.g., `axivon-frontend`, `axivon-backend`, `axivon-design-system`).

| Advantages | Disadvantages |
|---|---|
| Clear ownership boundary per repository, matching team boundaries | Cross-cutting changes require coordinated PRs across multiple repos (harder to keep in sync, as `04-FULL-STACK-TEAM.md` §12 already notes for Full-Stack's cross-repo work) |
| Finer-grained access control per repository | Shared code (types, tokens, contracts) needs a publish/consume mechanism (internal package registry) to avoid duplication |
| Independent CI/release cadence per repo | More repositories to keep individually healthy (branch protection, CI config, dependency updates × N) |
| Smaller, faster individual repos | Easier for conventions to drift between repos over time without deliberate enforcement |

### Option C — Hybrid

A small number of repositories grouped by natural boundary rather than by team — for example, one repo for the Frontend application plus its component library, one for all Backend services, and a separate lightweight repo for design assets (which `01-UI-UX-TEAM.md` §14 already treats as its own repository, `design-assets`, regardless of which option is chosen for the rest of the platform).

| Advantages | Disadvantages |
|---|---|
| Captures most of monorepo's coordination benefit for tightly-coupled code (e.g., Backend's modules, which share Core services) | Still requires a cross-repo coordination mechanism between the groups (e.g., Frontend ↔ Backend contract changes) |
| Avoids polyrepo's proliferation for code that genuinely changes together | The grouping itself becomes a decision that needs revisiting as the module catalog grows |
| Keeps the design-assets repository's already-established simple, low-frequency workflow (`01-UI-UX-TEAM.md` §14) untouched | Less "clean" than either pure option; requires judgment calls about what belongs where |

### Impact Summary

| Dimension | Monorepo | Polyrepo | Hybrid |
|---|---|---|---|
| Four-team coordination | Easiest — one place to look | Hardest — requires disciplined cross-repo linking (§12) | Moderate |
| Reusable module consumption | Simplest (no publish step) | Requires internal packages (§29) | Depends on grouping |
| Deployment | Requires path-based/selective build tooling | Naturally maps one repo → one deployable unit | Mixed |
| Permissions | Coarser (branch/path rules within one repo) | Finer (per-repo) | Finer than monorepo, coarser than full polyrepo |
| Versioning | Simple internally; external module versioning still needed if modules are ever externalized | Natural per-repo versioning | Per-group versioning |

**Recommendation:** a **Hybrid** approach — one repository for Frontend (application + shared component library), one repository for Backend (Core services + all Reusable/Industry module APIs), and the already-established separate `design-assets` repository for UI/UX (per `01-UI-UX-TEAM.md` §14) — gives most of monorepo's coordination benefit where it matters most (Backend's many interdependent modules sharing Core services, per `05-SYSTEM-ARCHITECTURE.md` §5–6) without forcing Frontend and Backend, which have different release cadences and toolchains, into one repository. This is a **Recommendation**, not a final decision.

**Status: TBD — Architecture/Technical Lead decision required**, exactly as `04-FULL-STACK-TEAM.md` §12 already states. Everything else in this document (branch names, PR rules, labels, etc.) applies unchanged regardless of which option is chosen — only the repository *boundaries* differ, not the workflow inside each boundary.

---

## 5. Repository Structure

The recommended structure below is intentionally technology-agnostic, consistent with `05-SYSTEM-ARCHITECTURE.md`'s deferral of specific frameworks, and is compatible with any of the three options in §4 (each repository in a Hybrid/Polyrepo setup follows the same internal shape it would in a Monorepo, just rooted differently).

```text
AXIVON-ONE/                    (illustrative monorepo root; in Hybrid/Polyrepo,
│                                each top-level folder below becomes its own repo root)
├── apps/
│   └── frontend/               → the Frontend application (per 02-FRONTEND-TEAM.md §14 structure)
├── services/
│   └── backend/                → Core services + Business/Industry module APIs (per 03-BACKEND-TEAM.md §15 structure)
├── packages/                   → shared, internally-versioned code (types, API client, design tokens consumption) — see §29
├── design-assets/              → tokens, exported assets, design docs (per 01-UI-UX-TEAM.md §14) — Figma remains the design source of truth
├── docs/                       → this documentation series (00–09 and future documents)
├── tests/                      → cross-cutting/end-to-end tests owned by Full-Stack (per 04-FULL-STACK-TEAM.md)
├── scripts/                    → developer tooling, CI helper scripts
├── config/                     → environment configuration templates (never real secrets — see §24)
└── README.md
```

| Directory | Purpose |
|---|---|
| `apps/` | Deployable frontend application(s) |
| `services/` | Deployable backend service(s); internally organized per `03-BACKEND-TEAM.md` §15 (`modules/`, `core/`, `database/`, `api/`, `middleware/`) |
| `packages/` | Code shared across `apps/` and `services/` without needing a separate published registry — an internal package boundary (§29), not a public one |
| `design-assets/` | Version-controlled design tokens/exports; Figma remains authoritative for the design files themselves (§11) |
| `docs/` | The `00`–`09`+ documentation series, kept in the same repository ecosystem so documentation changes go through the same PR/review process as code (§2) |
| `tests/` | End-to-end and cross-cutting test suites that don't belong to a single app/service |
| `scripts/` | Local dev setup, CI helpers, code generation |
| `config/` | Environment configuration *templates* (`.env.example`-style files) — actual secrets never live here (§24) |

If the Hybrid recommendation in §4 is confirmed, `apps/frontend`, `services/backend`, and `design-assets` each become their own repository root, and the diagram above collapses to three repositories with the same internal shape.

---

## 6. Branching Strategy

`02-FRONTEND-TEAM.md` §14, `03-BACKEND-TEAM.md` §15, and `04-FULL-STACK-TEAM.md` §12 all independently arrived at the same answer, for the same reason. This document confirms it as the **platform-wide standard**.

| Strategy | Fit for AXIVON ONE |
|---|---|
| **Git Flow** | Rejected as the default — its long-lived `develop`/`release` branches and heavier ceremony add overhead not justified by AXIVON ONE's continuous, modular development style across many parallel modules (as `03-BACKEND-TEAM.md` §15 explicitly notes: long-lived branches per module would increase merge conflict risk) |
| **GitHub Flow** (feature branches straight into `main`, deploy continuously) | Too lightweight on its own — AXIVON ONE benefits from one integration point (`develop`) before `main`, so multiple modules under active development across four teams can stabilize together before a release, without every merge to `main` being an implicit production release |
| **Trunk-Based Development** | The right foundation — short-lived feature branches, frequent integration, minimal long-lived divergence |
| **Hybrid (chosen)** | **Trunk-based development with short-lived feature branches, integrated into `develop`, promoted to `main` via lightweight `release/*` branches** — this is what `02`, `03`, and `04` already converged on independently |

**Recommended and Confirmed branch model:**

```text
main
│
├── develop
│
├── feature/<ticket-id>-short-description
├── fix/<ticket-id>-short-description
├── refactor/<ticket-id>-short-description
├── hotfix/<ticket-id>-short-description
└── release/<version>
```

- `main` — always production-ready; only reached via `release/*` (or `hotfix/*` for emergencies).
- `develop` — the shared integration branch; where feature/fix/refactor branches merge.
- `feature/*`, `fix/*`, `refactor/*` — short-lived, one per unit of work, branched from and merged back into `develop`.
- `hotfix/*` — branched from `main` for an urgent production fix, merged to both `main` and `develop`.
- `release/*` — a short-lived stabilization branch cut from `develop` before promotion to `main` (§20).

**Why this fits a four-team, reusable-platform project specifically:**

- **Team size/parallelism** — four teams working across Core, Reusable, and (eventually) Industry modules simultaneously need frequent, low-friction integration; short-lived branches minimize the "big merge" risk Git Flow is prone to at this scale.
- **Release frequency** — AXIVON ONE's MVP/V1/V2 phasing (`00-PROJECT-OVERVIEW.md` §19) implies incremental, frequent releases of a growing module catalog, not infrequent, large-batch releases — trunk-based development supports that naturally.
- **Client-project reuse** — a client engagement branches off validated, released module versions (via tags, §22), not off a permanently diverging long-lived branch, keeping the reusable core clean (§30).
- **Maintainability** — fewer, shorter-lived branches means less time spent on conflict resolution and more on features.
- **Complexity** — matches the complexity the platform actually has today (per `00-PROJECT-OVERVIEW.md` §40, "do not over-engineer prematurely"); can be revisited if release cadence formalizes significantly (`02-FRONTEND-TEAM.md` §14 already anticipates this).

**Design-assets exception (Confirmed, per `01-UI-UX-TEAM.md` §14):** the `design-assets` repository uses a *simpler* trunk-based model with no `develop` branch at all — short-lived `feature/design-token-update-v1.2`-style branches merge directly into `main` via PR — because token/asset changes are low-frequency and low-conflict, and the extra integration branch would add overhead without benefit there.

---

## 7. Branch Naming Convention

```text
feature/<ticket-id>-<short-description>
fix/<ticket-id>-<short-description>
refactor/<ticket-id>-<short-description>
hotfix/<ticket-id>-<short-description>
release/<version>
```

**Examples, matching the modules already named across `01`–`04`:**

```text
feature/AX-142-auth-login
feature/AX-201-crm-customer-management
feature/AX-118-user-role-permissions

fix/AX-233-login-validation
fix/AX-245-customer-api-error

refactor/AX-190-auth-service
refactor/AX-176-design-system

hotfix/AX-301-payment-failure
```

**Rules:**

- **Case:** all lowercase, no exceptions — matches the naming style used in `01-UI-UX-TEAM.md` §14's example (`feature/design-token-update-v1.2`).
- **Hyphens:** words within the description are hyphen-separated; no underscores, no spaces.
- **Ticket ID:** every branch (except `release/*`) includes the linked issue's ticket ID (§12) — `02-FRONTEND-TEAM.md` §14 and `03-BACKEND-TEAM.md` §15 both require this ("no untracked feature work" / "every branch tied to a ticket"). The exact ticket-ID prefix (`AX-` above) is illustrative; the real prefix depends on the issue-tracking tool chosen (GitHub Issues numbers, or an external tracker's key) — **TBD**.
- **Description:** 2–5 words, specific enough to identify the change without opening the branch — not `feature/AX-142-fix` or `feature/AX-142-updates`.
- **Maximum reasonable branch scope:** one feature branch should map to one issue/task (§12), completable and reviewable within days, not weeks. If a branch is still open after a full sprint, it's a signal the underlying issue was too large and should have been split during refinement (`09-AGILE-SPRINT-PLAN.md` §11–14).
- `release/<version>` uses the semantic version being prepared (§21), e.g., `release/1.2.0` — no ticket ID, since a release branch aggregates many.

---

## 8. Commit Convention

**Conventional Commits**, already adopted independently in `02-FRONTEND-TEAM.md` §14 and `03-BACKEND-TEAM.md` §15 — **Confirmed** as the platform-wide standard, extended here with the full type list and design-specific variant already used in `01-UI-UX-TEAM.md` §14.

```text
feat:      a new feature
fix:       a bug fix
docs:      documentation only
style:     formatting, whitespace — no code logic change
refactor:  code change that neither fixes a bug nor adds a feature
test:      adding or correcting tests
chore:     tooling, build config, dependency bumps — no production code change
build:     changes affecting the build system or external dependencies
ci:        changes to CI/CD configuration
perf:      a performance improvement
design:    design-asset/token changes (design-assets repository only, per 01-UI-UX-TEAM.md §14)
```

**Format:** `type(scope): short, imperative description`

**Examples, specific to AXIVON ONE modules:**

```text
feat(auth): add password reset flow
feat(crm): add customer creation API
feat(crm): add lead conversion endpoint
fix(users): prevent duplicate email registration
fix(auth): correct token refresh timing
docs(api): update customer endpoint documentation
refactor(core): simplify permission service
test(crm): add customer validation tests
design(tokens): update primary color scale
design(assets): add invoice icon set
chore(deps): bump dependency versions
```

**What makes a good commit:**

- The `scope` names the module (`auth`, `crm`, `users`, `billing`, `core`) — consistent with the resource/module naming already used in `07-API-SPECIFICATION.md` §9, so a commit's scope and an API's module namespace read the same way.
- The description is imperative ("add", not "added" or "adds") and specific enough to be meaningful in a changelog (§23) without opening the diff.
- One logical change per commit — a commit that mixes an unrelated formatting pass with a feature addition should be split.
- The commit body (optional, below the summary line) explains *why*, when the *what* isn't self-evident from the diff alone — especially for `fix:` and `refactor:` commits.
- Commit messages never reference internal-only context that won't make sense outside the immediate conversation — the linked issue (§12) carries that detail; the commit message stays self-contained.

---

## 9. Pull Request Standard

Every PR includes:

- **Title** — Conventional Commit-style summary (`feat(crm): add lead conversion endpoint`), matching the primary commit if the PR is a single logical change.
- **Description** — what changed and why, in a sentence or two.
- **Related issue** — a link to the GitHub Issue this PR closes or references (§12) — no PR without a linked issue, per §3 principle 2.
- **Summary** — a short bullet list of the key changes.
- **Changes** — the specific files/areas affected, if not obvious from the diff (e.g., "adds a new migration," "adds a new permission `crm.lead.convert`").
- **Testing** — what was tested and how (unit, integration, manual) — matching the relevant team's Definition of Done (`01`–`04` §18–20/§16–17).
- **Screenshots** — required for any UI-visible change, showing before/after or the new state; matches `01-UI-UX-TEAM.md`'s Design QA expectations.
- **API changes** — called out explicitly if the PR touches any endpoint's contract, with a note on whether it's breaking (per `07-API-SPECIFICATION.md` §33) — if breaking, the PR must reference the corresponding API version bump.
- **Database changes** — called out explicitly if the PR includes a migration, per §27 of this document.
- **Breaking changes** — flagged prominently at the top of the description if present, in any layer.
- **Deployment considerations** — anything a deploy needs to know (new environment variable, migration order, feature flag state) — per `03-BACKEND-TEAM.md` §20's "deployment-ready" Definition of Done criterion.

### Recommended PR Template

```markdown
## Summary
<!-- What does this PR do, in 1-3 sentences? -->

## Related Issue
Closes #

## Changes
-
-

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested locally
- [ ] Manually tested against staging

## Screenshots (UI changes only)
<!-- Before/after, or N/A -->

## API Changes
- [ ] No API changes
- [ ] Non-breaking API change (describe below)
- [ ] Breaking API change (requires version bump — see 07-API-SPECIFICATION.md §33)

## Database Changes
- [ ] No database changes
- [ ] Migration included (see 08-GIT-GITHUB-STANDARD.md §27)

## Breaking Changes
- [ ] None
- [ ] Yes (describe, and note migration/communication plan)

## Deployment Considerations
<!-- New env vars, migration order, feature flags, rollback notes, or N/A -->
```

---

## 10. Code Review Process

- **Who reviews:** at minimum, one Senior/Lead from the owning team, per `02-FRONTEND-TEAM.md` §14 and `03-BACKEND-TEAM.md` §15's "minimum one senior/lead approval."
- **Minimum reviewers:** 1 for standard changes; 2 when a change touches shared/Core code that multiple modules depend on, or spans team boundaries (see below).
- **When review is mandatory:** always — every PR into `develop` or `main`, with no exception for "small" changes, per §3 principle 4.
- **What reviewers check:**
  - Correctness against the linked issue's acceptance criteria (`09-AGILE-SPRINT-PLAN.md` §12).
  - Adherence to this document's conventions (naming, commits) and the relevant team document's Definition of Done.
  - Security implications — especially authorization and tenant-scoping for any Backend change (per `07-API-SPECIFICATION.md` §18, §28).
  - Test coverage — that meaningful tests exist and pass, not just that CI is green.
  - Whether the change duplicates existing reusable capability instead of using it (per `00-PROJECT-OVERVIEW.md` §40, "reuse before rebuilding").
- **How comments are handled:** every comment is either resolved by a follow-up change or answered with a rationale before the PR merges; comments are not silently dismissed.
- **Approval rules:** the PR cannot merge until the required number of approvals (above) are in place and all conversations are resolved.
- **Re-review requirement:** a substantive push after approval (not a typo fix or rebase) invalidates prior approval and requires re-review.

### Team-Specific Review Focus

| Review Type | Focus |
|---|---|
| **Frontend review** | Design fidelity (matches UI/UX handoff), component reuse vs. duplication, accessibility, error/loading/empty states (per `02-FRONTEND-TEAM.md` §19) |
| **Backend review** | Authorization/tenant-scoping correctness, validation completeness, API contract adherence, migration safety (per `03-BACKEND-TEAM.md` §20) |
| **Full-Stack review** | End-to-end correctness across the full flow, third-party integration handling, cross-layer consistency (per `04-FULL-STACK-TEAM.md` §17) |
| **UI/UX review** | Design-system compliance for any token/asset change (per `01-UI-UX-TEAM.md` §14, §19), not code review in the traditional sense |
| **Cross-team review** | Required in addition to the owning team's review whenever a PR touches shared Frontend components, Backend Core services, or the design-token/asset repository — the owning team's lead reviews alongside the author's own team lead, per `04-FULL-STACK-TEAM.md` §12's rule for cross-cutting Full-Stack work |

---

## 11. UI/UX Version Control

Per `01-UI-UX-TEAM.md` §14, Figma remains the design source of truth — designers are **not** required to commit binary Figma files into Git.

- **Design versioning:** the design system itself is versioned (e.g., `v1.0`, `v1.1`) inside Figma, with breaking changes noted (per `01-UI-UX-TEAM.md` §6); the exported *tokens* that Frontend consumes are additionally versioned in Git via the `design-assets` repository (§5–7).
- **Design approval:** a design is approved by the UI/UX Lead (and Product, for user-facing flows) before handoff — matching `01-UI-UX-TEAM.md` §19's Definition of Done.
- **Design handoff:** the handoff package (Figma link, component specs, states, tokens, copy, accessibility notes — per `01-UI-UX-TEAM.md` §13) is linked from the relevant GitHub Issue (§12), not communicated only in chat.
- **Design change documentation:** any change to an already-handed-off design that affects an in-progress or completed Frontend implementation is documented as a comment on the relevant Issue, and — if it changes data shape (e.g., a new required field) — flagged to Backend during refinement, per `01-UI-UX-TEAM.md` §16's coordination note.
- **Linking designs to Issues/PRs:** every Frontend Issue that has a design reference includes the Figma link in its description (§12); the Frontend PR (§9) that implements it references the same Issue, closing the loop from design → issue → PR without requiring the design file itself to live in Git.

**Release tags** for the design system (`design-v1.0.0`, per `01-UI-UX-TEAM.md` §14) are matched to the Frontend release that implements against them, so it's always clear which design version a given Frontend release was built to.

---

## 12. Issue Management

Every significant work item is a GitHub Issue containing:

- **Title** — concise, specific (matches the branch description style, §7).
- **Description** — what needs to be done and why.
- **Business context** — the "so that" behind the work, especially for User Stories (`09-AGILE-SPRINT-PLAN.md` §11).
- **Acceptance criteria** — the specific, testable conditions for completion (`09-AGILE-SPRINT-PLAN.md` §12).
- **Priority** — `P0`–`P3` (`09-AGILE-SPRINT-PLAN.md` §10).
- **Team** — which of the four teams owns it (label, §14).
- **Owner** — the individual currently responsible.
- **Dependencies** — links to blocking/blocked-by issues.
- **Labels** — per the label system (§14).
- **Milestone** — the sprint or release it belongs to (§15).

No branch is opened (§7) and no PR is filed (§9) without a corresponding Issue — this is what makes "traceability" (§3 principle 2) an enforced property of the repository, not an aspiration.

---

## 13. Issue Types

| Type | Explanation |
|---|---|
| **Epic** | A large body of work spanning multiple sprints, corresponding to the top of the task hierarchy shared by all four teams (`01`–`04` §15/§16/§13, `09-AGILE-SPRINT-PLAN.md` §3) — e.g., "AXIVON Core Identity & Access" |
| **Feature** | A meaningful, shippable slice of an Epic — e.g., "Role & Permission Management" |
| **User Story** | A user-facing description of value, in the `As a / I want / So that` format (`09-AGILE-SPRINT-PLAN.md` §11) |
| **Task** | A concrete unit of implementation work under a Story, owned by one team |
| **Bug** | A defect in already-shipped or in-progress work — tracked with severity/priority per `09-AGILE-SPRINT-PLAN.md` §29 |
| **Improvement** | A non-urgent enhancement to existing, working functionality |
| **Refactor** | A code-quality change with no user-facing behavior change |
| **Documentation** | Changes to `00`–`09`+ or in-code documentation |
| **Security** | A security-relevant fix or hardening task — handled per the sensitive-disclosure note in §32 |
| **Technical Debt** | Tracked and prioritized per `09-AGILE-SPRINT-PLAN.md` §28 |

---

## 14. Label System

A small, deliberately bounded label system — per `00-PROJECT-OVERVIEW.md` §40's "avoid over-engineering," this is not expanded into hundreds of one-off labels.

```text
team:uiux
team:frontend
team:backend
team:fullstack

type:epic
type:feature
type:story
type:task
type:bug
type:improvement
type:refactor
type:docs
type:security
type:tech-debt

priority:p0
priority:p1
priority:p2
priority:p3

status:ready
status:in-progress
status:blocked
status:review
status:done

module:core
module:crm
module:tasks
module:projects
module:billing
```

- Every Issue gets exactly one `team:*`, one `type:*`, and one `priority:*` label.
- `status:*` labels mirror the board columns (§16) and are updated as work moves, rather than left stale.
- `module:*` labels are added incrementally as modules are built (per `00-PROJECT-OVERVIEW.md` §14–16's module catalog) — not pre-created for every Future industry module before it's scoped.
- No additional label categories are introduced without updating this document (§36 governs changes).

---

## 15. Milestones

Milestones represent a **time-boxed or scope-boxed unit of delivery**, used for two distinct purposes:

| Milestone Type | Example | Purpose |
|---|---|---|
| **Sprint** | `Sprint 3` | Groups all Issues committed to in a given sprint (`09-AGILE-SPRINT-PLAN.md` §16), across all four teams |
| **Release** | `v1.2.0` | Groups the Issues that shipped in a specific tagged release (§22) |
| **Major Module** | `CRM Foundation` | Groups all Issues (potentially spanning multiple sprints) needed to bring a specific Reusable Module to "Stable/Reusable" per the module maturity model (`09-AGILE-SPRINT-PLAN.md` §34) |
| **MVP Milestone** | `MVP` | Groups every Issue in scope for the MVP definition (`00-PROJECT-OVERVIEW.md` §17), used to track overall MVP burn-down independent of sprint boundaries |

An Issue can belong to a Sprint milestone and a Major Module or MVP milestone simultaneously (GitHub supports only one Milestone per Issue at a time in the native feature — where this matters, the Major Module/MVP grouping is tracked via a `module:*` label plus a Project board view instead, §16).

---

## 16. Projects / Boards

A single, shared GitHub Project spans all four teams, with the following columns:

```text
Backlog → Ready → In Progress → Review → Testing → Done
```

| Column | Meaning |
|---|---|
| Backlog | Not yet refined/ready (`09-AGILE-SPRINT-PLAN.md` §14, Definition of Ready not yet met) |
| Ready | Meets Definition of Ready; eligible for sprint planning |
| In Progress | Actively being worked |
| Review | PR open, pending code review (§10) |
| Testing | Merged to `develop`, undergoing QA/integration verification |
| Done | Meets Definition of Done (§33, and the relevant team's `01`–`04` §18–20/§16–17) |

**One shared board, filtered views per team:** rather than four separate boards (which would recreate the "four disconnected processes" problem `09-AGILE-SPRINT-PLAN.md` §4 explicitly warns against), every team works off the same underlying Project, using the `team:*` label (§14) to create a filtered, team-specific view. This keeps cross-team dependencies visible on the full board while still giving each team an uncluttered view of just their own work.

---

## 17. Protected Branches

| Branch | Protection Rules |
|---|---|
| `main` | PR required; minimum 1 (2 for cross-team/Core changes, §10) approval; all required CI status checks must pass; no force push; no direct commits; only reachable via `release/*` or `hotfix/*` |
| `develop` | PR required; minimum 1 approval; required CI status checks must pass (lint, tests, build — per `02-FRONTEND-TEAM.md` §14 and `03-BACKEND-TEAM.md` §15); no force push; no direct commits |
| `release/*` | PR required for any fix applied during stabilization; treated with the same rigor as `main` since it's the immediate precursor to a production release |

**Required CI status checks** (exact tooling `TBD`, per `05-SYSTEM-ARCHITECTURE.md`'s unresolved tooling decisions), at minimum:

- Lint / static analysis
- Unit and integration tests
- Build success
- For Backend: migration validation (§27)
- For any API-touching PR: contract validation against `07-API-SPECIFICATION.md`'s documented shape, where tooling supports it (§43 of `07-API-SPECIFICATION.md`)

---

## 18. Merge Strategy

| Strategy | Trade-off |
|---|---|
| **Merge commit** | Preserves full branch history but clutters `develop`'s history with every intermediate WIP commit from a feature branch |
| **Squash merge** | Clean, one-commit-per-feature history on `develop`; loses intermediate commit granularity, which is rarely needed once a feature has landed |
| **Rebase and merge** | Clean linear history without a merge commit, but rewrites commit hashes, which is riskier for shared/long-lived branches |

**Recommended and Confirmed (per `02-FRONTEND-TEAM.md` §14, `03-BACKEND-TEAM.md` §15, `04-FULL-STACK-TEAM.md` §12):**

- **Squash-merge** feature/fix/refactor branches into `develop` — keeps `develop`'s history clean and readable, with one Conventional Commit-style entry per feature (making changelog generation, §23, straightforward).
- **Merge commit** for `release/*` into `main` — preserves the fact that a discrete release happened and exactly what set of squashed commits it contained, which matters for release-level traceability and rollback (§20).

---

## 19. Conflict Resolution

- **Pull latest changes** — always rebase (or merge, for `release/*` stabilization) against the latest `develop` before opening or updating a PR.
- **Understand both changes** — read what the incoming and outgoing changes are actually doing before resolving; a conflict is a signal two people touched related logic, which is worth understanding, not just clearing.
- **Resolve carefully** — never blindly accept "ours" or "theirs" as a shortcut; each hunk is resolved deliberately.
- **Run tests** — after resolving, the full relevant test suite runs locally before pushing, not just a visual check that the conflict markers are gone.
- **Never blindly accept all incoming changes** — especially in database migrations (§27), where blind acceptance can silently drop another team's schema change.
- **Ask the original author when uncertain** — if the intent of the conflicting change isn't clear from the code and its commit message/PR, ask before guessing.

**Specific to database migrations** (per `03-BACKEND-TEAM.md` §15): migration conflicts are resolved with an explicit ordering review — two migrations authored in parallel need a deliberate decision about which applies first, not an automatic merge-tool resolution.

---

## 20. Release Strategy

```text
Development → Testing → Staging → Production
```

Matches the environments already defined in `07-API-SPECIFICATION.md` §7.

- **Release branches:** a `release/<version>` branch is cut from `develop` when its contents are feature-complete for that version; only bug fixes land on it during stabilization (via PR, §17); once stable, it merges to `main` (merge commit, §18) and is tagged (§22).
- **Tags:** every release to `main` is tagged with its semantic version (§21–22) at the merge commit.
- **Semantic versioning:** applied to the platform as a whole and, where they diverge, to the API separately (per `03-BACKEND-TEAM.md` §15's note that "API version tags [are] tracked separately from app version if they diverge," consistent with `07-API-SPECIFICATION.md` §8's independent API versioning).
- **Release notes:** generated from the Conventional Commit history (§8) between the previous and current tag, organized by type (`feat`, `fix`, etc.) into the changelog (§23).
- **Changelog:** maintained per §23, updated as part of the release process, not written from memory after the fact.
- **Rollback:** since `main` only ever advances via tagged releases, rolling back means redeploying the previous tag; a `hotfix/*` branch (§6) is used for any fix needed on top of a released version before the next full release is ready.

---

## 21. Versioning

Semantic versioning — `MAJOR.MINOR.PATCH` — applied platform-wide.

| Segment | Meaning for AXIVON ONE |
|---|---|
| **MAJOR** | A breaking change to a published contract — most importantly, an API breaking change (per `07-API-SPECIFICATION.md` §8), but also a breaking change to a shared internal package (§29) or the design system (`01-UI-UX-TEAM.md` §6) |
| **MINOR** | A new, backward-compatible capability — a new module, a new endpoint, a new optional field |
| **PATCH** | A backward-compatible bug fix |

Applied thoughtfully to reusable modules specifically: because a Reusable Module (CRM, Billing, etc.) is meant to serve every client unmodified (`00-PROJECT-OVERVIEW.md` §4), a MAJOR bump to that module's contract is a platform-wide event requiring the same review rigor as a Core API breaking change (`07-API-SPECIFICATION.md` §33), not a decision made unilaterally by the module's immediate author.

---

## 22. Tagging

```text
v0.1.0
v0.2.0
v1.0.0
```

- Tags follow `vMAJOR.MINOR.PATCH`, applied at the `release/*` → `main` merge commit (§20).
- A tag is created **only** for a release that has passed through Testing and Staging (§20) — never tagged directly from `develop` or a feature branch.
- Pre-`v1.0.0` tags (`v0.x.y`) correspond to the MVP phase (`00-PROJECT-OVERVIEW.md` §19); `v1.0.0` marks the first release considered stable enough to represent the validated MVP foundation.
- If API versioning diverges from application versioning (§21), API-specific tags (e.g., `api-v1.3.0`) are used alongside application tags, per `03-BACKEND-TEAM.md` §15.

---

## 23. Changelog

Maintained per release, generated from Conventional Commit history (§8), organized as:

| Section | Contains |
|---|---|
| **Added** | New features, new endpoints, new modules (`feat:`) |
| **Changed** | Behavior changes to existing functionality, non-breaking (`refactor:`, behavioral `fix:` with user-visible effect) |
| **Fixed** | Bug fixes (`fix:`) |
| **Security** | Security-relevant fixes — described without disclosing exploitable detail (§32) |
| **Deprecated** | Contracts/endpoints/fields marked for future removal (per `07-API-SPECIFICATION.md` §34) |
| **Removed** | Contracts/endpoints/fields actually removed in this release (MAJOR version, §21) |

---

## 24. Security Rules

- **Never commit** passwords, API keys, tokens, or private credentials, in any branch, at any time — including in example/config files (use `config/*.example` templates, §5, with placeholder values only).
- **Use environment variables/secrets management** for all real credentials — never source-controlled, per `05-SYSTEM-ARCHITECTURE.md` §12's explicit statement that "no production secrets, credentials, or example keys appear in" the architecture documentation, extended here to mean they never appear in the repository either.
- **Review dependencies** before adding them — check for known vulnerabilities and maintenance status (§26).
- **Use branch protection** (§17) to prevent secrets from landing via an unreviewed direct push.
- **Review third-party code** (packages, snippets) before incorporating it, especially anything handling authentication, payments, or file uploads.
- **Rotate compromised credentials immediately** if a secret is ever accidentally committed — treat the exposure as live the moment it's pushed, even if the commit is later removed from history (removing it from history does not un-expose it if the repository was ever fetched or is public).
- **Restrict repository permissions** per §25 — access is granted by role and need, not by default.

If a secret is accidentally committed: rotate the credential immediately, then remove it from history (e.g., via a history-rewrite tool) as a secondary cleanup step — rotation, not history-rewriting, is the actual mitigation.

---

## 25. Access Control

Conceptual GitHub permission tiers (no employee names, per project convention):

| Role | Typical Access |
|---|---|
| **Organization Owner** | Full control over the GitHub organization; manages billing, org-wide security policy, and top-level team structure |
| **Repository Administrator** | Full control over a specific repository, including branch protection rules (§17) and settings |
| **Team Lead** (UI/UX, Frontend, Backend, Full-Stack) | Write access to their team's primary repositories; approval authority on PRs touching their domain (§10) |
| **Developer** | Write access sufficient to open branches and PRs against `develop`; cannot push directly to protected branches (§17) |
| **Designer** | Write access to the `design-assets` repository (§11); typically read-only elsewhere unless also contributing code |
| **Reviewer** | Read/comment access sufficient to review PRs, without necessarily having write access to the repository (e.g., a stakeholder reviewing UI changes) |
| **Read-only Contributor** | Read access only — e.g., a Product stakeholder who needs visibility into Issues/PRs but does not write code |

Permissions are assigned per role, reviewed periodically, and revoked promptly when someone's role changes or they leave a team — access control is a security control (§24), not an afterthought.

---

## 26. Dependency Management

- **Version pinning/constraints:** dependencies are pinned to specific versions (or constrained to a tested compatible range) in a lockfile, so builds are reproducible across environments (§7).
- **Updates:** routine dependency updates are batched and reviewed on a regular cadence, not applied ad hoc mid-feature.
- **Security updates:** a dependency with a known vulnerability is prioritized outside the normal update cadence — treated as at least `P1` (`09-AGILE-SPRINT-PLAN.md` §10).
- **Dependency review:** a new dependency is reviewed for maintenance status, license compatibility, and necessity before being added — not added just because it's convenient for one small piece of functionality that could be written directly.
- **Removal of unused dependencies:** dependencies no longer referenced by any code are removed during normal maintenance, not left to accumulate (per §3 principle 14, "keep repositories clean").

Specific tooling (Dependabot or equivalent) is `TBD`, pending the backend/frontend framework and package-manager decisions (`05-SYSTEM-ARCHITECTURE.md`'s TBD list).

---

## 27. Database Change Workflow

Since AXIVON ONE has a dedicated, detailed database architecture (`06-DATABASE-ARCHITECTURE.md`), every schema change follows a workflow that keeps Git history and the database's actual state in sync:

```text
Database Change (schema/entity change identified)
   ↓
Migration (written, following 06-DATABASE-ARCHITECTURE.md conventions: naming, timestamps, soft-delete decisions)
   ↓
Pull Request (migration + any application code depending on it, together)
   ↓
Review (Backend Lead reviews the migration specifically for tenant-scoping impact, per 07-API-SPECIFICATION.md §18, and indexing impact, per 06-DATABASE-ARCHITECTURE.md §21)
   ↓
Testing (migration applies cleanly against a test database; rollback path verified)
   ↓
Staging (migration applied to staging; verified against realistic data volume where practical)
   ↓
Production (migration applied as part of the release process, §20)
```

- Every migration ships in the same PR as the code that depends on it — never as a standalone, disconnected change (per `03-BACKEND-TEAM.md` §15's "schema changes require a linked migration ticket").
- Migrations are additive/backward-compatible wherever possible (add a column before removing the old one, over multiple releases) so a rolling deployment never has application code running against a schema it doesn't expect.
- Any migration touching a tenant-scoped entity (per `06-DATABASE-ARCHITECTURE.md` §11) is reviewed specifically for whether it preserves the `organization_id` scoping requirement.

---

## 28. API Change Workflow

Every API change follows a workflow that keeps `07-API-SPECIFICATION.md`'s documentation and the real implementation from drifting apart:

```text
API Specification Update (proposed contract change, per 07-API-SPECIFICATION.md §32)
   ↓
Backend Change (implementation)
   ↓
Frontend Impact Assessment (does this require a Frontend change? per 07-API-SPECIFICATION.md §32's contract-review workflow)
   ↓
Contract Testing (verifies implementation matches the documented contract, per 07-API-SPECIFICATION.md §42–43)
   ↓
Documentation Update (07-API-SPECIFICATION.md §31's OpenAPI/Swagger docs, if adopted)
   ↓
Review (Backend Lead + Frontend/Full Stack, per 07-API-SPECIFICATION.md §32)
   ↓
Release (versioned per 07-API-SPECIFICATION.md §8; breaking changes require a MAJOR bump, §21)
```

This is the same Contract Management workflow already defined in `07-API-SPECIFICATION.md` §32, expressed here in terms of the actual Git/GitHub steps (branch, PR, review, merge, tag) that carry it out.

---

## 29. Reusable Module Versioning

Reusable Modules (CRM, Tasks, Projects, Billing, etc., per `00-PROJECT-OVERVIEW.md` §15) are versioned as part of the Backend service's overall semantic version (§21) for MVP/V1 — **not** split into independently published internal packages, since the Hybrid repository recommendation (§4) keeps Backend as one repository and there is not yet a validated need for independent module release cadences (per `00-PROJECT-OVERVIEW.md` §40's "avoid over-engineering").

- **Internal packages/shared libraries** are reserved for genuinely cross-cutting code used by *both* Frontend and Backend (or by multiple otherwise-independent repositories) — e.g., shared TypeScript types generated from the API contract, or the design-token consumption layer — living in `packages/` (§5).
- **Module releases** — a specific module's readiness is tracked via the module maturity model (`09-AGILE-SPRINT-PLAN.md` §34: Idea → Planned → Design → Development → Testing → Stable → Reusable → Versioned → Deprecated), with "Versioned" meaning the module's contract is stable enough that other consumers (Industry Modules, per `05-SYSTEM-ARCHITECTURE.md` §10's dependency rules) can safely build on it.
- **Compatibility** — a Reusable Module's breaking change follows the same MAJOR-version discipline as the platform API (§21, `07-API-SPECIFICATION.md` §33), since Industry Modules depend on Reusable Modules directly (e.g., Education's Fees depending on Billing).
- **Breaking changes** to a Reusable Module are reviewed with explicit consideration of every current and reasonably-anticipated consumer, not just the client engagement that motivated the change — this is the mechanism that protects reusability in practice, not just in principle.

**Status:** publishing modules as independently versioned, installable packages is a **Future** possibility (consistent with `00-PROJECT-OVERVIEW.md` §39's "developer platform / internal APIs for extending the platform"), not adopted now.

---

## 30. Client Customization Rules

This is one of the most important rules in this document, directly protecting the reusability mandate in `00-PROJECT-OVERVIEW.md` §4.

**Avoid, inside Core or Reusable Module code:**

```text
if organization.id == "client-x-id":
    special logic
```

Any pattern like this — a conditional branch keyed to a specific client's identity, embedded in shared code — defeats the entire purpose of a reusable platform: the next client inherits the special case as dead code at best, and a source of bugs at worst.

**Prefer:**

```text
Core
+
Configuration (organization-level settings, enabled modules, business rules — per 06-DATABASE-ARCHITECTURE.md §11's tenant-scoped configuration)
+
Extension (a genuinely new capability, classified per 00-PROJECT-OVERVIEW.md §13 as Client Customization, Industry, or Reusable, and built as such — not smuggled into Core)
```

- **Client-specific branches are avoided** — there is no `client/acme-corp` long-lived branch containing forked Core logic. If a client genuinely needs behavior no other client should get, that requirement goes through the classification process (`00-PROJECT-OVERVIEW.md` §13, `09-AGILE-SPRINT-PLAN.md` §33) *before* any code is written, and is implemented either as configuration, or — if it's a real Client Customization — as an isolated extension that does not modify Core/Reusable Module code paths (per `05-SYSTEM-ARCHITECTURE.md` §10's dependency rule: "Client Customization code being imported by, or merged into, Core, Shared Services, or Reusable Module code paths" is explicitly **not allowed**).
- **Genuine exceptions:** a client-specific branch may be justified only for a time-boxed proof-of-concept explicitly agreed with the Architecture/Technical Lead as *not* headed for production merge — never as a standing pattern for shipping client work.

---

## 31. Development Workflow

```text
Issue (§12)
   ↓
Branch (§6–7)
   ↓
Development
   ↓
Commit (§8)
   ↓
Push
   ↓
Pull Request (§9)
   ↓
Review (§10)
   ↓
Testing (per the relevant team's Definition of Done, §33)
   ↓
Approval
   ↓
Merge (§18) → develop
   ↓
Release (§20) → release/* → main
```

This is the same flow implied across `01-UI-UX-TEAM.md` §14–16, `02-FRONTEND-TEAM.md` §14–16, `03-BACKEND-TEAM.md` §15–17, and `04-FULL-STACK-TEAM.md` §12–14 — this document simply makes it one explicit, shared diagram.

---

## 32. GitHub Standard Templates

### Bug Report

```markdown
## Description
<!-- What's wrong? -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior

## Actual Behavior

## Environment
- Environment: (dev/test/staging/production)
- Browser/Device (if applicable):

## Severity
<!-- See 09-AGILE-SPRINT-PLAN.md §29 -->

## Screenshots/Logs
```

### Feature Request

```markdown
## Problem
<!-- What need does this address? -->

## Proposed Solution

## Alternatives Considered

## Additional Context
```

### User Story

```markdown
## Story
As a [user type]
I want [capability]
So that [benefit]

## Acceptance Criteria
Given [context]
When [action]
Then [outcome]

## Dependencies

## Priority

## Estimate

## Team
```

### Pull Request

See §9.

### Security Issue

```markdown
## Summary
<!-- A high-level description only. Do NOT include exploit details,
     proof-of-concept code, or specific attack steps in this public template. -->

## Affected Area
<!-- Module/endpoint/component, described generally -->

## Impact
<!-- Who/what is affected, at a high level -->

## Suggested Reporting Path
If this describes an exploitable vulnerability rather than a general hardening idea,
report it privately to the Architecture/Technical Lead or Engineering Manager rather
than filing a public Issue, so it can be triaged before details are public.
```

The Security Issue template deliberately avoids collecting exploit detail in a public-by-default Issue tracker; a real vulnerability report is routed privately, per the template's own instruction.

---

## 33. Definition of Done — GitHub

A GitHub task is complete only when:

- [ ] Acceptance criteria satisfied (per the linked Issue, §12)
- [ ] Code/design complete
- [ ] Tests complete (per the relevant team's Definition of Done, `01`–`04`)
- [ ] Review complete (§10)
- [ ] Documentation updated (§2 principle 10; `07-API-SPECIFICATION.md` §31 for API changes)
- [ ] PR merged (§9, §18)
- [ ] No critical issues remain (no unresolved `P0`/`P1` bugs introduced, `09-AGILE-SPRINT-PLAN.md` §29)

This is the GitHub-mechanics layer of "Done"; it is satisfied *in addition to*, not instead of, each team's own Definition of Done (`01` §19, `02` §19, `03` §20, `04` §17) and the project-wide Definition of Done (`09-AGILE-SPRINT-PLAN.md` §15).

---

## 34. Git/GitHub Daily Checklist

- [ ] Pull the latest `develop` before starting work.
- [ ] Confirm the Issue you're working on has a linked branch, or create one following §6–7.
- [ ] Commit in small, logical units, following §8.
- [ ] Push regularly — don't let a branch diverge from `develop` for days without rebasing.
- [ ] Open (or update) the PR as soon as there's reviewable progress, marked as a draft if not yet ready for approval.
- [ ] Respond to review comments the same day where practical.
- [ ] Re-run tests after resolving any merge conflict (§19).
- [ ] Update the linked Issue's status label (§14) as work moves across the board (§16).
- [ ] Delete your branch after it's merged.

---

## 35. Common Git/GitHub Mistakes

- Committing directly to `develop` or `main`, bypassing PR review.
- Opening a branch without a linked Issue, breaking traceability (§3 principle 2).
- Writing a commit message that just says "fixes," "updates," or "wip" with no context.
- Letting a feature branch live for weeks without rebasing against `develop`, guaranteeing a painful merge later.
- Force-pushing to a shared branch (`develop`, `main`, or any branch someone else is also working on).
- Committing a secret "temporarily," intending to remove it before merging (§24 — the exposure happens the moment it's pushed, not the moment it's merged).
- Blindly resolving merge conflicts by accepting one side wholesale, especially in database migrations (§19, §27).
- Adding a client-specific conditional to Core/Reusable Module code instead of following §30.
- Treating a PR as done because CI is green, without an actual human review having happened (§10).
- Letting `main` diverge from what's actually running in production because a hotfix (§6) was applied without also merging it back to `develop`.
- Skipping the changelog/documentation update because "the code speaks for itself" (§2 principle 10; §23).

---

## 36. Final Git/GitHub Governance

| Decision | Approver (Role) |
|---|---|
| Changes to the branch model, commit convention, or merge strategy (§6, §8, §18) | Engineering Manager, with Backend Lead and input from all four Team Leads (matching `00-PROJECT-OVERVIEW.md` §36's "Cross-team process/standards" ownership) |
| Repository strategy decision (§4) | Architecture/Technical Lead |
| Changes to branch protection rules (§17) | Engineering Manager, with Repository Administrator |
| Changes to the label/board system (§14, §16) | Engineering Manager, with input from all four Team Leads |
| Access control changes (§25) | Organization Owner, with the relevant Team Lead |
| This document itself | Engineering Manager, with Backend Lead and Architecture/Technical Lead — per `00-PROJECT-OVERVIEW.md` §38's Change Management process |

No individuals are named — role titles only, so this document remains valid as team membership changes, consistent with every other document in this series.
