# AX1-P3-BUS-001-FE-02 — Core Workflows & QA

FR-105 frontend implementation package.

## Included
- Primary workflow list/table with search, status filtering and pagination.
- Create/edit workflow form with client-side validation.
- Create/update/delete interactions through an injected approved API contract.
- Loading, empty, error, retry and saving/deleting states.
- Permission-aware create/edit/delete actions.
- Responsive table overflow and accessible labels/status messaging.
- Validation regression tests.

## API contract
`workflow-api.ts` intentionally does not define backend URLs. The application must inject the approved API client so no backend endpoint is invented or renamed by this task.
