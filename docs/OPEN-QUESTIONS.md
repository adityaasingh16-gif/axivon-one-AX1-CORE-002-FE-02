# Open Questions — CORE-001 Authentication

These are existing architecture decisions intentionally left open by the
repository documentation. This task records how the backend deliverable behaves
without silently treating a provisional choice as final.

| ID | Question | Current implementation | Decision owner / follow-up |
|---|---|---|---|
| Q1 | Should successful responses use `success/data/timestamp` only, or the API spec's `data/meta` envelope? | Uses the repository's shipped `success/data/message/timestamp` envelope and adds optional `meta` where useful. | Architecture/API Lead: ratify one platform-wide response schema. |
| Q2 | Is email verification named `/auth/verify` or `/auth/verify-email`? | `/auth/verify` is canonical per `docs/07-API-SPECIFICATION.md`; `/auth/verify-email` is a compatibility alias because `docs/03-BACKEND-TEAM.md` also lists it. | API Lead: keep alias or deprecate it in the next contract release. |
| Q3 | JWT, opaque tokens, or server-side sessions? | Hybrid short-lived HS256 access token + hashed refresh-token-backed server-side session, behind `TokenProvider`. | Architecture/Technical Lead; see `docs/adr/ADR-001-token-strategy.md`. |
| Q4 | Argon2, bcrypt or another password hash? | Node `scrypt` behind `PasswordHasher`; no plaintext storage. | Security/Architecture Lead; see `docs/adr/ADR-002-password-hashing.md`. |
| Q5 | Which production database, email provider and distributed rate-limit store? | Repository, `Mailer` and `RateLimiter` interfaces plus in-memory local implementations. | Backend/Infrastructure leads before staging. |
| Q6 | What organization is selected at login for users belonging to multiple organizations? | Client-supplied `organizationId` is rejected; authentication returns a platform identity/session only. Membership/org selection is deferred to CORE-005. | Organization/API Lead; add an explicit selection/exchange flow if required. |

No item above blocks the API contract or the isolated unit/integration tests in
this task; each is exposed as an interface or documented compatibility choice.
