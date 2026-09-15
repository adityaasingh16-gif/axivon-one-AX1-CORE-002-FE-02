-- AXIVON ONE — CORE-001 Authentication
-- Task: AX1-CORE-001-BE-02
--
-- Depends on 001_create_users.sql.
-- The application layer stores only hashes for passwords, refresh tokens and
-- single-use auth tokens. Raw secrets exist only in the one response/email
-- where they are issued and are never written to this schema.

BEGIN;

-- The initial users migration predates the authentication API contract. Add
-- the fields required by the pending -> active verification flow and account
-- lockout policy without changing existing rows' meaning.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_users_failed_login_attempts_non_negative;

ALTER TABLE users
    ADD CONSTRAINT chk_users_failed_login_attempts_non_negative
    CHECK (failed_login_attempts >= 0);

CREATE INDEX IF NOT EXISTS idx_users_locked_until
    ON users (locked_until)
    WHERE locked_until IS NOT NULL;

-- Server-side sessions make logout and password-change revocation effective.
-- A session is tied to a user, not to an organization: users may belong to
-- multiple organizations (`06-DATABASE-ARCHITECTURE.md` §7).
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- SHA-256 of the refresh token, never the raw token.
    refresh_token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20) NOT NULL DEFAULT 'unknown',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_auth_sessions_device_type
        CHECK (device_type IN ('web', 'mobile', 'api', 'unknown'))
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
    ON auth_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_active
    ON auth_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;

-- Email verification and password-reset links share one table but are scoped
-- by purpose. `invalidated_at` is separate from `consumed_at`: a superseded
-- link is invalid, not "already used", which keeps the API's generic token
-- failure semantics correct.
CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_auth_tokens_purpose
        CHECK (purpose IN ('email_verification', 'password_reset')),
    CONSTRAINT uq_auth_tokens_hash_purpose
        UNIQUE (token_hash, purpose)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_purpose
    ON auth_tokens (user_id, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_active
    ON auth_tokens (token_hash, purpose, expires_at)
    WHERE consumed_at IS NULL AND invalidated_at IS NULL;

COMMIT;

-- Adapter implementation notes:
-- 1. Consume a token atomically:
--    UPDATE auth_tokens
--       SET consumed_at = NOW()
--     WHERE id = $1
--       AND consumed_at IS NULL
--       AND invalidated_at IS NULL
--       AND expires_at > NOW()
--    RETURNING id;
-- 2. Revoke one session atomically:
--    UPDATE auth_sessions SET revoked_at = NOW(), updated_at = NOW()
--     WHERE id = $1 AND revoked_at IS NULL
--    RETURNING id;
-- 3. Rotate a refresh hash only when the old hash still matches the presented
--    hash, inside a transaction, to prevent two concurrent refreshes from both
--    succeeding.
