# AXIVON ONE — Task-Based Development Workflow

## Step-by-Step Developer Workflow

1. **Find Your Task**: Check your assigned task in `docs/tasks/phase-1/` or `PHASE-1-TASK-TRACEABILITY.md`.
2. **Create Task Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/AX1-CORE-001-FE-01
   ```
3. **Implement Deliverable**: Write code in the designated module area.
4. **Commit Using Convention**:
   ```bash
   git commit -m "feat(auth): implement login view components [AX1-CORE-001-FE-01]"
   ```
5. **Open PR**: Target `develop` or `main` with the standard PR title format.
6. **Merge & Close**: Once reviewed and approved, merge the PR.
