# User Management API Reference — CORE-002

Tasks: `AX1-CORE-002-BE-P1`, `AX1-CORE-002-BE-P2`

Base prefix: `/api/v1`

All User Management endpoints require `Authorization: Bearer <access-token>`.
The caller's identity comes from the access token; request bodies cannot select a
caller or bypass authorization.

## Endpoints

| Operation | Method + path | Access | Success |
|---|---|---|---|
| Create user | `POST /users` | `user:manage` | `201`, user profile |
| List users | `GET /users` | `user:manage` | `200`, paginated result |
| Read user | `GET /users/:id` | Admin or same user | `200`, user profile |
| Update user | `PATCH /users/:id` | Admin or same user | `200`, updated profile |
| Update profile | `PATCH /users/:id/profile` | Admin or same user | `200`, updated profile |
| Change status | `POST /users/:id/status` | `user:manage` | `200`, updated profile |
| List memberships | `GET /users/:id/memberships` | `user:manage` | `200`, memberships |
| Add membership | `POST /users/:id/memberships` | `user:manage` | `201`, membership |
| Remove membership | `DELETE /users/:id/memberships/:organizationId` | `user:manage` | `200`, removed flag |

## Create user

```json
{
  "email": "person@example.com",
  "password": "StrongPass1!",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "phone": "+1-555-0100",
  "avatarUrl": "https://cdn.example/avatar.png",
  "status": "pending",
  "organizationIds": ["00000000-0000-4000-8000-000000000001"]
}
```

Passwords are hashed with the Authentication module's password hasher. Password
hashes are never returned. New users default to `pending` and unverified unless
an explicitly authorized provisioning flow supplies another state.

## List query

`GET /api/v1/users?page=1&pageSize=25&search=ada&status=active&organizationId=<uuid>`

All query parameters are optional. `pageSize` is bounded to 100.

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 25,
    "totalPages": 0
  },
  "timestamp": "2026-09-16T00:00:00.000Z"
}
```

## Status values

`active`, `inactive`, `suspended`, `pending`.

Membership statuses are `active`, `inactive`, `invited`, and `suspended`.

## Authorization

- `user:manage` is required for list, create, status and membership operations.
- A user may read and update their own profile.
- Administrator identities may be configured locally with the comma-separated
  `USER_MANAGEMENT_ADMIN_USER_IDS` environment variable.
- The future Roles/Permissions modules can replace this policy through the
  `UserAuthorization` interface without changing the service or HTTP contract.

## Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "email", "issue": "must be a valid email address" }
    ],
    "requestId": "req_..."
  },
  "timestamp": "2026-09-16T00:00:00.000Z"
}
```

Documented error codes include `UNAUTHORIZED`, `FORBIDDEN`, `USER_NOT_FOUND`,
`EMAIL_ALREADY_EXISTS`, `INVALID_STATUS`, `MEMBERSHIP_NOT_FOUND`,
`MEMBERSHIP_ALREADY_EXISTS`, `VALIDATION_ERROR`, and `INTERNAL_ERROR`.
