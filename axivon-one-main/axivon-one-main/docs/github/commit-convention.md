# AXIVON ONE — Commit Message Convention

AXIVON ONE follows the **Conventional Commits** specification, optionally tagged with the Task ID.

## Format
```text
<type>(<scope>): <description> [TASK-ID]
```

## Types
- `feat`: A new feature or deliverable
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Examples
- `feat(auth): implement login validation [AX1-CORE-001-FE-03]`
- `feat(user): add user list service [AX1-CORE-002-BE-02]`
- `fix(auth): resolve session validation issue [AX1-CORE-001-BE-04]`
- `test(auth): add authentication API tests [AX1-CORE-001-BE-05]`
- `docs(auth): add user flow wireframe spec [AX1-CORE-001-UX-02]`
