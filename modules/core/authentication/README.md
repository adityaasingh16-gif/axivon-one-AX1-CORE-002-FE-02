# Authentication Backend Module (CORE-001)

Task: `AX1-CORE-001-BE-02`

This module implements the backend contract for registration, email
verification, login, logout, password recovery and session handling. It follows
`docs/07-API-SPECIFICATION.md` §16 and §35 and the security requirements in
`docs/03-BACKEND-TEAM.md`.

## Current boundary

The repository does not yet select a production HTTP framework, database driver,
email provider or final token strategy. The module therefore uses explicit,
swappable interfaces:

| Boundary | Current implementation | Production replacement |
|---|---|---|
| HTTP | `http/auth.routes.ts` + framework-free request/response types | Express/Fastify/Hono adapter once the architecture decision is made |
| Persistence | `repositories/in-memory.repository.ts` | PostgreSQL adapter implementing `repositories/index.ts` |
| Passwords | `node:crypto` scrypt | Keep scrypt or replace behind `PasswordHasher` after Architecture Lead review |
| Tokens | HS256 JWT behind `TokenProvider` | Replace with approved JWT/opaque-token implementation if the decision changes |
| Email | `RecordingMailer` | Provider-agnostic Notifications/Email Service (`CORE-008`) |
| Rate limit | In-memory fixed window | Shared Redis implementation for multiple API instances |

The default composition root is intentionally runnable for local development and
unit tests. It is **not** a production deployment: it uses in-memory data and
must be wired to durable repositories and a real mail provider before release.

## Routes

All routes are under `/api/v1`.

| Method | Path | Auth | Purpose |
|---|---|---:|---|
| `POST` | `/auth/register` | No | Create a pending user and send an email-verification link |
| `POST` | `/auth/verify` | No | Consume a verification token and activate a pending user |
| `POST` | `/auth/verify-email` | No | Documented alias of `/auth/verify` |
| `POST` | `/auth/login` | No | Verify credentials and issue access token, refresh token and session |
| `POST` | `/auth/refresh` | No | Verify and rotate a refresh token |
| `POST` | `/auth/logout` | Bearer | Revoke the current server-side session |
| `POST` | `/auth/forgot-password` | No | Request a reset link; always returns a generic response |
| `POST` | `/auth/reset-password` | No | Consume a reset token, update the password and revoke sessions |
| `GET` | `/auth/sessions` | Bearer | List the caller's live sessions |
| `POST` | `/auth/sessions/revoke` | Bearer | Revoke one caller-owned session |
| `POST` | `/auth/sessions/revoke-all` | Bearer | Revoke all caller sessions |

The route table is exported through `createAuthRouter().routes()` so contract
and integration tests can assert the paths without starting a server.

## Request examples

### Registration

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "Sup3rSecret!",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

The account starts as `pending`. The response never contains a password hash or
verification token:

```json
{
  "success": true,
  "data": { "accepted": true },
  "message": "If that email address is available, a verification link has been sent.",
  "timestamp": "2026-09-10T09:00:00.000Z"
}
```

The duplicate-email path intentionally returns the same response shape and
message. The service does not send a second verification mail, but the HTTP
consumer cannot use the response as an account-enumeration oracle.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "Sup3rSecret!"
}
```

```json
{
  "success": true,
  "data": {
    "user": { "id": "…", "email": "ada@example.com", "status": "active", "emailVerified": true },
    "tokens": {
      "accessToken": "<access-token>",
      "refreshToken": "<refresh-token>",
      "expiresIn": 3600
    },
    "session": {
      "id": "…",
      "expiresAt": "2026-09-17T09:00:00.000Z",
      "deviceType": "web",
      "createdAt": "2026-09-10T09:00:00.000Z"
    }
  },
  "message": "Signed in successfully.",
  "timestamp": "2026-09-10T09:00:00.000Z",
  "meta": { "tokenType": "Bearer", "expiresIn": 3600 }
}
```

### Password recovery

`POST /auth/forgot-password` always returns `200` with `data.accepted: true`,
whether or not the email is registered. Reset tokens are 256-bit random values,
stored only as SHA-256 hashes, expire, and are single-use. A new request
invalidates the previous link.

`POST /auth/reset-password` accepts:

```json
{ "token": "<single-use-token>", "password": "BrandNewPass1!" }
```

A successful reset revokes every existing session, clears the login lockout
counter, and sends a password-changed notification. It does not automatically
log the user in.

## Error contract

Every error uses the platform envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The email or password is incorrect.",
    "details": [],
    "requestId": "req_…"
  },
  "timestamp": "2026-09-10T09:00:00.000Z"
}
```

Important codes include:

- `VALIDATION_ERROR` (`422`) — field-level `details`.
- `INVALID_CREDENTIALS` (`401`) — same safe message for unknown email and wrong password.
- `EMAIL_NOT_VERIFIED` (`401`).
- `ACCOUNT_LOCKED` / `ACCOUNT_SUSPENDED` (`401`).
- `INVALID_OR_EXPIRED_TOKEN` / `TOKEN_ALREADY_USED` (`401`).
- `SESSION_REVOKED` (`401`).
- `EMAIL_ALREADY_REGISTERED` (`409`) — available from the service boundary; the
  public registration controller uses a generic response instead.
- `RATE_LIMITED` (`429`) with `Retry-After`.

Unexpected errors are logged server-side and returned as `INTERNAL_ERROR`; stack
traces, SQL, filesystem paths, passwords and token values are never included
in an API response.

## Security behaviour

- Passwords use a salt and adaptive, memory-hard `scrypt` hash.
- Bearer access and refresh tokens use different secrets and pinned `HS256`.
- A random nonce makes token rotation unique even when two tokens are issued in
the same second.
- Refresh hashes are stored server-side; rotated-token replay revokes the entire
session family for that user.
- Logout and password change revoke server-side sessions.
- Failed logins have configurable rate limits and account lockout.
- Verification/reset tokens are hashed, expiring and atomic-single-use at the
repository boundary.
- Tenant identifiers supplied by a client are not trusted. Organization context
will come from authenticated membership when the Organization module is wired.
- Auth events are emitted through `AuthAuditSink` without passwords, hashes or
raw tokens.

## Local development

```bash
npm ci
npm run typecheck
npm run test:auth
npm run build
API_PORT=5000 npm run dev --workspace @axivon/backend
```

The development server binds to `0.0.0.0` and serves the routes above. It uses
in-memory users/sessions and the recording mailer; restart it to clear data.

## Files

- `backend/contracts/` — DTOs, response envelopes, route constants and error codes.
- `backend/validators/` — reusable request validation and JSON Schema generation.
- `backend/services/auth.service.ts` — business/application flows.
- `backend/repositories/` — persistence contracts and in-memory test/local implementation.
- `backend/utils/` — password, token, random-token and rate-limit primitives.
- `backend/http/` — controller, router, middleware, error mapping and Node adapter.
- `backend/factory.ts` — composition root.
- `tests/` — service, token, password and HTTP contract coverage.
- `../../../database/migrations/002_create_auth_tables.sql` — durable schema contract.
