# User Management Module (CORE-002)

## Scope

This backend deliverable implements the CORE-002 User Management API:

- User model, service and API contracts
- Create, list and detail/read operations
- Profile and general user updates
- User status transitions
- Membership list/add/remove operations
- Validation, authorization and consistent error envelopes
- PostgreSQL/Neon persistence with an in-memory test adapter

## Layout

```text
modules/core/user-management/
├── backend/
│   ├── config/
│   ├── contracts/
│   ├── database/
│   ├── http/
│   ├── repositories/
│   ├── services/
│   ├── validators/
│   ├── factory.ts
│   └── index.ts
├── shared/
├── tests/
└── docs/
```

## Database

Run these migrations in order in the Neon SQL editor:

1. `database/migrations/001_create_users.sql`
2. `database/migrations/002_create_auth_tables.sql`
3. `database/migrations/003_create_user_management_tables.sql`

Set the Neon connection URI locally through `DATABASE_URL`. Never commit the
URI or paste it into source control or chat. When `DATABASE_URL` is present,
the backend composes PostgreSQL adapters for both Authentication and User
Management. Without it, unit tests and local contract tests use in-memory
adapters.

## API routes

All routes are under `/api/v1` and require a valid Authentication access token:

- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/profile`
- `POST /users/:id/status`
- `GET /users/:id/memberships`
- `POST /users/:id/memberships`
- `DELETE /users/:id/memberships/:organizationId`

Management operations require a configured administrator identity or future RBAC
permission (`user:manage`). A user may read/update their own profile, while
list/create/status/membership operations remain administrator-only.
