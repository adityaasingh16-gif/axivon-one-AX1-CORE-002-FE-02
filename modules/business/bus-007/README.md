# BUS-007 Employee Management — FR-105

Task: `AX1-P3-BUS-007-FE-14` — Core Workflows & QA.

## Included in this task
- Employee API client for list/search/filter, create, update, delete and status changes. Requests use the existing auth store's bearer token.
- Accessible management view with search, department/status filters, validation, loading/empty/error/retry/success states and permission-gated actions.
- Authenticated employee API routes registered in the backend application.
- Focused workflow/API tests for validation, filtering, listing, authorization, duplicate prevention and CRUD/status behavior.

## Endpoints
- `GET /api/v1/employees?search=&status=&department=&page=1&pageSize=10`
- `POST /api/v1/employees`
- `PATCH /api/v1/employees/:id`
- `DELETE /api/v1/employees/:id`
- `PATCH /api/v1/employees/:id/status`

## Important implementation boundary
The employee records use an in-memory adapter and seeded demo records for workflow testing. This PR does not claim database persistence or organization-level tenant isolation; those require an approved employee schema and tenant contract. The view is exported for the consuming BUS-007 route to mount and defaults to read-only unless `canManage` is explicitly granted.
