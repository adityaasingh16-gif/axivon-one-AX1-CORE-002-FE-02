# Authentication API Reference — CORE-001

Task: `AX1-CORE-001-BE-02`

Base prefix: `/api/v1`

## Endpoint contract

| Operation | Method + path | Request body | Success |
|---|---|---|---|
| Register | `POST /auth/register` | `email`, `password`, `firstName`, `lastName` | `201`, generic `{ "accepted": true }`; verification mail is sent through `Mailer` |
| Verify email | `POST /auth/verify` | `token` | `200`, active/verified user |
| Verify email alias | `POST /auth/verify-email` | `token` | Same as `/auth/verify` |
| Login | `POST /auth/login` | `email`, `password` | `200`, access token, refresh token and session |
| Refresh | `POST /auth/refresh` | `refreshToken` | `200`, rotated tokens and session |
| Logout | `POST /auth/logout` | None; `Authorization: Bearer` header | `200`, `{ "revoked": true/false }` |
| Forgot password | `POST /auth/forgot-password` | `email` | Always `200`, `{ "accepted": true }` |
| Reset password | `POST /auth/reset-password` | `token`, `password` | `200`, password changed; old sessions revoked |
| List sessions | `GET /auth/sessions` | None; Bearer header | `200`, caller-owned live sessions |
| Revoke session | `POST /auth/sessions/revoke` | `sessionId` | `200`, revoked session |
| Revoke all | `POST /auth/sessions/revoke-all` | None; Bearer header | `200`, count revoked |

## Authentication rules

- Registration, verification, login, refresh, forgot-password and reset-password
  are public routes; rate limiting applies to each.
- Logout and session-management routes require a valid Bearer access token **and
  a live backing session**.
- Passwords, password hashes, raw reset/verification tokens, refresh-token
  hashes and token secrets are never returned.
- The login error is intentionally generic for both an unknown email and a bad
  password.
- A client cannot choose tenant context by sending `organizationId`; membership
  context is resolved by the authenticated identity and Organization module.

## Request validation

Invalid JSON shapes return `422`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "password", "issue": "must be at least 8 characters" }
    ],
    "requestId": "req_…"
  },
  "timestamp": "2026-09-10T09:00:00.000Z"
}
```

Passwords on registration/reset must be between the configured minimum and
maximum, contain a letter and number, and contain no whitespace. Login only
requires a non-empty password so the service does not leak account policy in an
authentication failure.

## Error codes

| Code | Status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 422 | Request shape or field value is invalid |
| `INVALID_CREDENTIALS` | 401 | Generic credential failure |
| `EMAIL_NOT_VERIFIED` | 401 | User must verify email first |
| `ACCOUNT_LOCKED` | 401 | Temporary lockout after failed attempts |
| `ACCOUNT_SUSPENDED` | 401 | Suspended account cannot authenticate |
| `INVALID_OR_EXPIRED_TOKEN` | 401 | Signature, purpose, expiry or token state failed |
| `TOKEN_ALREADY_USED` | 401 | A single-use token was redeemed already |
| `SESSION_REVOKED` | 401 | The backing session was revoked or expired |
| `UNAUTHORIZED` | 401 | Bearer authentication is required |
| `EMAIL_ALREADY_REGISTERED` | 409 | Service-level conflict; public register remains generic |
| `RESOURCE_NOT_FOUND` | 404 | Session missing or belongs to another user |
| `RATE_LIMITED` | 429 | Configured auth rate limit exceeded; `Retry-After` is included |
| `INTERNAL_ERROR` | 500 | Unexpected server fault; details stay in server logs |

## Repository mapping

The durable schema is `database/migrations/001_create_users.sql` plus
`002_create_auth_tables.sql`. The real adapter must implement the contracts in
`modules/core/authentication/backend/repositories/index.ts` and must
preserve these invariants:

1. Token lookup uses the SHA-256 hash of the raw token.
2. Token consumption is an atomic conditional update.
3. Refresh rotation compares the presented hash and updates the session in one
   transaction/conditional update.
4. Session revocation is idempotent and returns whether the current call
   changed the row.
5. Every user/session/token mutation records `updated_at`/timestamps according
to the database conventions.

## Local server

```bash
API_PORT=5000 npm run dev --workspace @axivon/backend
```

The current server uses in-memory repositories and a recording mailer for the
initial deliverable. It is a local contract runner, not a production storage or
email deployment.
