# ADR-001 — Token and Session Boundary for CORE-001

- **Status:** Proposed implementation pending Architecture/Technical Lead approval
- **Date:** 2026-09-10
- **Scope:** Authentication (`CORE-001`)
- **Task:** `AX1-CORE-001-BE-02`

## Context

The architecture documents intentionally leave the token/session mechanism open:
stateless signed tokens and server-side sessions are both named options in
`docs/05-SYSTEM-ARCHITECTURE.md` §12 and `docs/07-API-SPECIFICATION.md` §16.
The API contract must remain stable while that decision is made.

Logout and password-change revocation are explicit security requirements, and
refresh-token replay must be detectable. A purely stateless access token cannot
satisfy those requirements by itself.

## Decision for this deliverable

Implement a **hybrid access-token + server-side session** boundary:

1. Issue a short-lived HS256 access token and a longer-lived refresh token.
2. Store a hash of the refresh token in `auth_sessions`.
3. Include the session id in both token payloads.
4. Rotate refresh tokens on every refresh and add a per-issuance nonce.
5. Revoke the server-side session on logout, password change, account action, or
   detected refresh-token replay.
6. Keep the concrete implementation behind `TokenProvider`, so the approved
   production strategy can replace HS256 with an approved library, asymmetric
   signing, or opaque tokens without changing the service or route contracts.

HS256 is a deliberately minimal local implementation because the repository had
no runtime token dependency when this task started. It is not a claim that the
final production algorithm has been approved.

## Consequences

### Positive

- Logout and password changes take effect immediately for the backing session.
- Refresh-token theft/reuse can revoke the session family.
- API consumers receive the endpoint shapes already specified in the repository.
- Token strategy remains swappable through one interface.

### Trade-offs

- Access-token verification still needs a session lookup for revocation.
- The in-memory repository is single-process and local-only; production needs a
  durable, shared store such as PostgreSQL plus a cache/Redis decision at scale.
- Secret rotation, key management and asymmetric signing remain deployment work.

## Follow-up before production

- Architecture Lead confirms signed-vs-opaque token strategy.
- Security review confirms algorithm, key rotation, leeway and storage policy.
- Replace `createInMemoryAuthRepositories` with a durable adapter.
- Add integration tests against the selected database and deployment topology.
