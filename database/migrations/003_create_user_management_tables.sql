-- AXIVON ONE — CORE-002 User Management
-- Task: AX1-CORE-002-BE-P1 / AX1-CORE-002-BE-P2
--
-- Depends on 001_create_users.sql and 002_create_auth_tables.sql.
-- Run this migration in the Neon SQL editor after the authentication migrations.
-- DATABASE_URL and database credentials must never be committed.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Organization/Tenant is CORE-005. The UUID is intentionally not given a
  -- foreign key until that module owns its organizations table and migration.
  organization_id UUID NOT NULL,
  role VARCHAR(100) NOT NULL DEFAULT 'member',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_memberships_user_organization UNIQUE (user_id, organization_id),
  CONSTRAINT chk_user_memberships_status
    CHECK (status IN ('active', 'inactive', 'invited', 'suspended')),
  CONSTRAINT chk_user_memberships_role_not_empty
    CHECK (length(trim(role)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id
  ON user_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_organization_id
  ON user_memberships (organization_id);

CREATE INDEX IF NOT EXISTS idx_users_status
  ON users (status);

COMMIT;
