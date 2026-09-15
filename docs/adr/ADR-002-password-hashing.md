# ADR-002 — Password Hashing Boundary for CORE-001

- **Status:** Proposed implementation pending Architecture/Technical Lead approval
- **Date:** 2026-09-10
- **Scope:** Authentication (`CORE-001`)
- **Task:** `AX1-CORE-001-BE-02`

## Context

`docs/03-BACKEND-TEAM.md` §7 recommends a modern adaptive password hash such
as Argon2 or bcrypt, but leaves the final algorithm open. The repository starts
with no authentication runtime dependency and must not store plaintext
passwords.

## Decision for this deliverable

Use Node's built-in **scrypt** implementation behind the `PasswordHasher`
interface. Each hash receives a random salt and stores its cost parameters in a
self-describing format:

```text
scrypt$N=16384$r=8$p=1$<base64 salt>$<base64 digest>
```

Verification uses constant-time comparison. Unknown/corrupt hash formats fail
closed. The service runs a dummy verification on the missing-user branch so
unknown-email and wrong-password timing is less distinguishable.

The implementation can be replaced with Argon2id, bcrypt, or an approved
password service by implementing the same interface and migrating records by
rehashing after a successful login.

## Consequences

- No native third-party dependency is required for the initial deliverable.
- Cost parameters can be raised after deployment sizing and security review.
- The default test suite uses a fast in-memory test hasher only in service tests;
  the real scrypt implementation has its own tests and is the production
  default in the composition root.

## Follow-up before production

- Security review selects and benchmarks the final cost parameters.
- Confirm whether Argon2id is required by the platform security baseline.
- Add a rehash-on-login migration path if the algorithm or cost changes.
