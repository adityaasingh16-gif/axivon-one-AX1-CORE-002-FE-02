# AXIVON ONE Backend Application

The backend application composes the Core Platform modules and exposes the
framework-agnostic API routers. CORE-001 Authentication is implemented at:

`../../modules/core/authentication/backend/`

## Run locally

```bash
# from repository root
npm ci
npm run typecheck
npm run test:auth
npm run build
API_PORT=5000 npm run dev --workspace @axivon/backend
```

The development server binds to `0.0.0.0` and exposes the authentication
contract under `/api/v1/auth/*`. It currently uses in-memory repositories and a
recording mailer because the repository's database, email-provider and HTTP
framework decisions are still marked TBD. Do not treat the default server as a
production deployment.

See:

- `../../modules/core/authentication/README.md`
- `../../docs/api/authentication.md`
- `../../database/migrations/002_create_auth_tables.sql`
- `../../docs/adr/ADR-001-token-strategy.md`
- `../../docs/adr/ADR-002-password-hashing.md`
