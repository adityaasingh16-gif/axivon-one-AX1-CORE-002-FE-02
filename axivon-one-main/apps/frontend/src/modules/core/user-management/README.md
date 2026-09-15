# User Management UI — CORE-002

Implementation for `AX1-CORE-002-FE-02`.

## Included

- Responsive user directory with search and status filtering.
- User profile detail view with account status and organization memberships.
- Create and edit user forms with client-side validation.
- Status updates using the documented `PATCH /api/v1/users/{id}` contract.
- API service for list/detail/create/update/delete operations.
- Store-driven list/detail/create/edit navigation.
- Loading, empty, validation, success and API-error states.
- Reusable DOM components that do not depend on a client-specific implementation.

## Integration

`UserManagementApp` is exported from the frontend app entry point. Call `mount(element, { loadFromApi: true })` when the backend user API is available. Without the option, the UI starts with local fixture data so the primary UI can be reviewed before backend integration is complete.

## API assumptions

The service follows the platform's documented user endpoints:

- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`

Backend responses are expected to use the shared `ApiResponse` and `PaginatedResult` contracts.
