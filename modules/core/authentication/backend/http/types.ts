/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Framework-agnostic HTTP primitives.
 *
 * The API style and framework are both `TBD` (`03-BACKEND-TEAM.md` §10,
 * `05-SYSTEM-ARCHITECTURE.md` §16), so this module defines its own minimal
 * request/response shape instead of importing Express/Fastify types. Wiring it
 * to any framework is a few lines — see `docs/api/authentication.md` §7.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface HttpRequest {
  method: HttpMethod;
  /** Full path including the `/api/v1` prefix. */
  path: string;
  headers: Record<string, string | undefined>;
  /** Already-parsed JSON body, or `undefined` when there is none. */
  body?: unknown;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  /** Envelope object; serialised by the adapter. */
  body: unknown;
}

export type HttpHandler = (request: HttpRequest) => Promise<HttpResponse>;

/** Case-insensitive header read — HTTP header names are case-insensitive. */
export const getHeader = (request: HttpRequest, name: string): string | undefined => {
  const needle = name.toLowerCase();
  for (const [key, value] of Object.entries(request.headers)) {
    if (key.toLowerCase() === needle) {
      return value;
    }
  }
  return undefined;
};

export const jsonHeaders = (extra: Record<string, string> = {}): Record<string, string> => ({
  'Content-Type': 'application/json; charset=utf-8',
  ...extra,
});
