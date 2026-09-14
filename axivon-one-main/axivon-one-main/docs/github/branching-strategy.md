# AXIVON ONE — Branching Strategy

## Philosophy: Task-Based Branching

> **CRITICAL RULE**:
> Employee-ID-based branching (`feature/EMP101`, `feature/VIKASH`, `feature/frontend-team`) is **STRICTLY PROHIBITED**.
> All development is tracked using **TASK IDs**.

### The Task Branching Formula:
```
ONE TASK ID
    =
ONE BRANCH
    =
ONE PULL REQUEST
    =
ONLY THAT TASK'S CODE
```

### Branch Naming Standard
```text
feature/<TASK-ID>
fix/<TASK-ID>
docs/<TASK-ID>
test/<TASK-ID>
```

#### Correct Examples:
- `feature/AX1-CORE-001-FE-01`
- `feature/AX1-CORE-001-BE-01`
- `feature/AX1-CORE-001-UX-01`
- `feature/AX1-CORE-001-FS-01`
- `fix/AX1-CORE-002-BE-04`

#### Forbidden Examples:
- ❌ `feature/EMP101`
- ❌ `feature/VIKASH`
- ❌ `feature/frontend-team`
- ❌ `feature/auth-login` (Must include Task ID)
