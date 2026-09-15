/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Outbound auth mail, behind a provider-agnostic interface.
 *
 * `03-BACKEND-TEAM.md` §7: "Email provider TBD ... must sit behind a
 * provider-agnostic interface so they can be swapped per client or globally."
 * `05-SYSTEM-ARCHITECTURE.md` §7 lists the Email Service as a Shared Service.
 *
 * This module therefore depends only on `Mailer`. The default implementation
 * records messages in memory (and optionally logs), which keeps the auth flows
 * runnable and testable before the provider decision lands. A real SMTP/API
 * provider is wired in by the Notifications module (CORE-008).
 *
 * SECURITY: tokens travel in the email body only. They are never logged by the
 * default mailer beyond the recorded message object, and never returned in an
 * API response (`07-API-SPECIFICATION.md` §16: "Never exposed").
 */

export type AuthMailTemplate =
  | 'email_verification'
  | 'password_reset'
  | 'password_changed'
  | 'suspicious_session';

export interface AuthMailMessage {
  to: string;
  template: AuthMailTemplate;
  subject: string;
  /** Raw single-use token. Handle with care; never log at info level in prod. */
  token: string;
  /** Token lifetime in seconds, so the template can state the expiry. */
  expiresInSeconds: number;
  /** Absolute expiry, ISO-8601 UTC. */
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface Mailer {
  send(message: AuthMailMessage): Promise<void>;
}

const SUBJECTS: Readonly<Record<AuthMailTemplate, string>> = {
  email_verification: 'Confirm your AXIVON ONE email address',
  password_reset: 'Reset your AXIVON ONE password',
  password_changed: 'Your AXIVON ONE password was changed',
  suspicious_session: 'A session on your AXIVON ONE account was signed out',
};

export interface RecordingMailerOptions {
  /** Also write to stdout. Off by default so tokens never reach CI logs. */
  echoToConsole?: boolean;
}

export interface RecordingMailer extends Mailer {
  readonly sent: readonly AuthMailMessage[];
  /** Most recent message for a recipient, or `undefined`. */
  lastFor(email: string): AuthMailMessage | undefined;
  clear(): void;
}

export const createRecordingMailer = (options: RecordingMailerOptions = {}): RecordingMailer => {
  const messages: AuthMailMessage[] = [];

  return {
    sent: messages,

    send: async (message: AuthMailMessage) => {
      messages.push(message);
      if (options.echoToConsole === true) {
        // Token intentionally included only when explicitly enabled.
        console.info(
          JSON.stringify({
            event: 'auth_mail',
            to: message.to,
            template: message.template,
            token: message.token,
            expiresAt: message.expiresAt,
          }),
        );
      }
    },

    lastFor: (email: string) => {
      const needle = email.trim().toLowerCase();
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (message !== undefined && message.to === needle) {
          return message;
        }
      }
      return undefined;
    },

    clear: () => {
      messages.length = 0;
    },
  };
};

export const buildAuthMailMessage = (input: {
  to: string;
  template: AuthMailTemplate;
  token: string;
  expiresInSeconds: number;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}): AuthMailMessage => ({
  to: input.to.trim().toLowerCase(),
  template: input.template,
  subject: SUBJECTS[input.template],
  token: input.token,
  expiresInSeconds: input.expiresInSeconds,
  expiresAt: input.expiresAt,
  metadata: input.metadata,
});
