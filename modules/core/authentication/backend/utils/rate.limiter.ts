/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Rate limiting for authentication endpoints.
 *
 * Required by `07-API-SPECIFICATION.md` §27 (auth endpoints are the highest
 * priority) and `03-BACKEND-TEAM.md` §7 (brute-force protection).
 * Numeric limits are NOT invented in code — they come from config, which is
 * environment-driven (§27: "must be configurable ... rather than hardcoded").
 *
 * The default is a fixed-window in-memory counter, which is correct for a
 * single process and deliberately swappable: `RedisRateLimiter` (shared state
 * across instances) is the production implementation and only needs to satisfy
 * `RateLimiter`.
 */

export interface RateLimitDecision {
  allowed: boolean;
  /** Whole seconds until the window resets — surfaced as `Retry-After`. */
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
}

export interface RateLimiter {
  /**
   * @param key     Bucket identifier, e.g. `login:ip:203.0.113.7`.
   * @param limit   Maximum hits per window. `0` disables the bucket.
   * @param windowSeconds Window length.
   */
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitDecision>;
  /** Drops all counters for a key — used after a successful login. */
  reset(key: string): Promise<void>;
}

export interface InMemoryRateLimiterOptions {
  /** Injectable clock, milliseconds since epoch. */
  nowMs?: () => number;
}

interface WindowState {
  count: number;
  resetsAtMs: number;
}

export const createInMemoryRateLimiter = (
  options: InMemoryRateLimiterOptions = {},
): RateLimiter => {
  const clock = options.nowMs ?? ((): number => Date.now());
  const windows = new Map<string, WindowState>();

  return {
    consume: async (key: string, limit: number, windowSeconds: number) => {
      if (limit <= 0) {
        return { allowed: true, retryAfterSeconds: 0, limit, remaining: Number.MAX_SAFE_INTEGER };
      }

      const nowMs = clock();
      const windowMs = Math.max(1, windowSeconds) * 1000;
      const existing = windows.get(key);

      if (existing === undefined || existing.resetsAtMs <= nowMs) {
        windows.set(key, { count: 1, resetsAtMs: nowMs + windowMs });
        return { allowed: true, retryAfterSeconds: 0, limit, remaining: limit - 1 };
      }

      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetsAtMs - nowMs) / 1000));

      if (existing.count >= limit) {
        return { allowed: false, retryAfterSeconds, limit, remaining: 0 };
      }

      existing.count += 1;
      return { allowed: true, retryAfterSeconds: 0, limit, remaining: limit - existing.count };
    },

    reset: async (key: string) => {
      windows.delete(key);
    },
  };
};

/** Deterministic limiter for tests: every request is allowed. */
export const createAllowAllRateLimiter = (): RateLimiter => ({
  consume: async (_key: string, limit: number) => ({
    allowed: true,
    retryAfterSeconds: 0,
    limit,
    remaining: limit,
  }),
  reset: async () => undefined,
});

/** Rate-limit bucket names — kept here so keys are consistent across endpoints. */
export const RATE_LIMIT_BUCKETS = {
  loginIp: (ip: string): string => `auth:login:ip:${ip}`,
  loginEmail: (email: string): string => `auth:login:email:${email}`,
  registerIp: (ip: string): string => `auth:register:ip:${ip}`,
  forgotPasswordIp: (ip: string): string => `auth:forgot:ip:${ip}`,
  forgotPasswordEmail: (email: string): string => `auth:forgot:email:${email}`,
  resetPasswordIp: (ip: string): string => `auth:reset:ip:${ip}`,
  verifyEmailIp: (ip: string): string => `auth:verify:ip:${ip}`,
} as const;
