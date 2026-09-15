/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Authentication event audit trail.
 *
 * `03-BACKEND-TEAM.md` §7 requires "audit logging of auth events";
 * `05-SYSTEM-ARCHITECTURE.md` §12 lists it as an auth security control.
 * The append-only store itself is owned by the Audit Logs module (CORE-010),
 * so this module only emits events through `AuthAuditSink`.
 *
 * What is emitted (`07-API-SPECIFICATION.md` §29): request id, actor, endpoint,
 * result, error category, tenant context.
 * What is NEVER emitted: passwords (plain or hashed), tokens, session secrets.
 */

import type { UUID } from '../contracts/index.js';

export type AuthAuditEvent =
  | 'auth.register'
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.login.locked'
  | 'auth.logout'
  | 'auth.token.refreshed'
  | 'auth.token.reuse_detected'
  | 'auth.forgot_password.requested'
  | 'auth.password.reset'
  | 'auth.email.verified'
  | 'auth.session.revoked'
  | 'auth.sessions.revoked_all';

export interface AuthAuditEntry {
  event: AuthAuditEvent;
  requestId: string;
  userId?: UUID;
  /** Email is recorded only for events where it is not itself the secret. */
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  /** Error `code` only — never the internal exception (§29). */
  errorCode?: string;
  outcome: 'success' | 'failure';
  occurredAt: string;
}

export interface AuthAuditSink {
  record(entry: AuthAuditEntry): Promise<void>;
}

export interface RecordingAuditSink extends AuthAuditSink {
  readonly entries: readonly AuthAuditEntry[];
  clear(): void;
}

export const createRecordingAuditSink = (): RecordingAuditSink => {
  const entries: AuthAuditEntry[] = [];
  return {
    entries,
    record: async (entry: AuthAuditEntry) => {
      entries.push(entry);
    },
    clear: () => {
      entries.length = 0;
    },
  };
};

/** Structured stdout sink. Redacts anything that is not explicitly allowed. */
export const createConsoleAuditSink = (): AuthAuditSink => ({
  record: async (entry: AuthAuditEntry) => {
    console.info(JSON.stringify({ scope: 'authentication', ...entry }));
  },
});

export const createNoopAuditSink = (): AuthAuditSink => ({
  record: async () => undefined,
});
