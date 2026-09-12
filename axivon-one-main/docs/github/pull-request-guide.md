# AXIVON ONE — Pull Request Guide

## Rules for Pull Requests
1. **One Task = One PR**: A pull request must only contain commits implementing the specific Task ID.
2. **Title Convention**:
   ```text
   [TEAM] TASK-ID — Short Description
   ```
   *Examples*:
   - `[FE] AX1-CORE-001-FE-01 — Authentication Frontend Foundation`
   - `[BE] AX1-CORE-001-BE-01 — Authentication Backend API Contracts`
   - `[UX] AX1-CORE-001-UX-01 — Authentication User Flow Specifications`
   - `[FS] AX1-CORE-001-FS-01 — Authentication End-to-End Architecture`
3. **Automated Checks**: PRs must pass CI linting, type-checking, and test validation.
4. **Code Review**: At least one peer review is required before merging.
