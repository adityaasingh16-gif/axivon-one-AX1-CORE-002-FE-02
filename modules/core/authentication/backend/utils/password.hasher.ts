/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Password hashing.
 *
 * `03-BACKEND-TEAM.md` §7 recommends "a modern adaptive hash such as Argon2 or
 * bcrypt, final choice by Architecture Lead". `argon2`/`bcrypt` are native
 * packages and this repository has no runtime dependencies yet, so the default
 * implementation uses **scrypt from `node:crypto`** — an adaptive,
 * memory-hard KDF — behind a swappable `PasswordHasher` interface.
 * See `docs/adr/ADR-002-password-hashing.md`.
 *
 * Storage format (self-describing, so parameters can be upgraded per record):
 *   scrypt$N=16384$r=8$p=1$<base64 salt>$<base64 hash>
 *
 * Plaintext passwords are never stored, logged or returned
 * (`03-BACKEND-TEAM.md` §22, `07-API-SPECIFICATION.md` §29).
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

export interface ScryptParams {
  /** CPU/memory cost. Must be a power of two. */
  N: number;
  /** Block size. */
  r: number;
  /** Parallelisation. */
  p: number;
  /** Derived key length, bytes. */
  keyLength: number;
  /** Salt length, bytes. */
  saltLength: number;
}

/**
 * N=16384 (2^14) is deliberately lower than OWASP's 2^17 suggestion so the
 * unit/integration suite stays fast on CI; raise it via config for production
 * once the Architecture Lead confirms deployment sizing.
 */
export const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  N: 16384,
  r: 8,
  p: 1,
  keyLength: 64,
  saltLength: 16,
};

export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, storedHash: string): Promise<boolean>;
  /**
   * Runs a hash against a throwaway password so the "user does not exist"
   * branch costs the same time as the "wrong password" branch — otherwise
   * response timing leaks account existence (`07-API-SPECIFICATION.md` §14).
   */
  dummyVerify(): Promise<void>;
}

export interface ScryptPasswordHasherOptions {
  params?: Partial<ScryptParams>;
}

const ALGORITHM = 'scrypt';

const encodeHash = (params: ScryptParams, salt: Buffer, digest: Buffer): string =>
  [
    ALGORITHM,
    `N=${params.N}`,
    `r=${params.r}`,
    `p=${params.p}`,
    salt.toString('base64'),
    digest.toString('base64'),
  ].join('$');

interface ParsedHash {
  params: ScryptParams;
  salt: Buffer;
  digest: Buffer;
}

const parseHash = (storedHash: string): ParsedHash | null => {
  const parts = storedHash.split('$');
  if (parts.length !== 6) {
    return null;
  }
  const [algorithm, nPart, rPart, pPart, saltPart, digestPart] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  if (algorithm !== ALGORITHM) {
    return null;
  }

  const readParam = (raw: string, prefix: string): number | null => {
    if (!raw.startsWith(`${prefix}=`)) {
      return null;
    }
    const value = Number(raw.slice(prefix.length + 1));
    return Number.isInteger(value) && value > 0 ? value : null;
  };

  const N = readParam(nPart, 'N');
  const r = readParam(rPart, 'r');
  const p = readParam(pPart, 'p');
  if (N === null || r === null || p === null) {
    return null;
  }
  // N must be a power of two for scrypt.
  if ((N & (N - 1)) !== 0) {
    return null;
  }

  const salt = Buffer.from(saltPart, 'base64');
  const digest = Buffer.from(digestPart, 'base64');
  if (salt.length === 0 || digest.length === 0) {
    return null;
  }

  return { params: { N, r, p, keyLength: digest.length, saltLength: salt.length }, salt, digest };
};

export const createScryptPasswordHasher = (
  options: ScryptPasswordHasherOptions = {},
): PasswordHasher => {
  const params: ScryptParams = { ...DEFAULT_SCRYPT_PARAMS, ...options.params };
  const maxmem = 256 * params.N * params.r;

  const derive = async (plaintext: string, salt: Buffer, keyLength: number, p: ScryptParams): Promise<Buffer> =>
    scryptAsync(plaintext, salt, keyLength, {
      N: p.N,
      r: p.r,
      p: p.p,
      maxmem,
    });

  return {
    hash: async (plaintext: string) => {
      const salt = randomBytes(params.saltLength);
      const digest = await derive(plaintext, salt, params.keyLength, params);
      return encodeHash(params, salt, digest);
    },

    verify: async (plaintext: string, storedHash: string) => {
      const parsed = parseHash(storedHash);
      if (parsed === null) {
        // Unknown/corrupt format: fail closed, never throw the format upward.
        return false;
      }
      const digest = await derive(plaintext, parsed.salt, parsed.digest.length, parsed.params);
      if (digest.length !== parsed.digest.length) {
        return false;
      }
      return timingSafeEqual(digest, parsed.digest);
    },

    dummyVerify: async () => {
      const salt = randomBytes(params.saltLength);
      await derive('axivon-timing-equalisation-dummy-password', salt, params.keyLength, params);
    },
  };
};

/**
 * In-memory hasher for tests only. NOT cryptographically secure — do not use
 * in any environment that talks to real credentials.
 */
export const createInsecurePlainTextHasher = (): PasswordHasher => {
  const prefix = 'test-only$';
  return {
    hash: async (plaintext: string) => `${prefix}${Buffer.from(plaintext).toString('base64')}`,
    verify: async (plaintext: string, storedHash: string) =>
      storedHash === `${prefix}${Buffer.from(plaintext).toString('base64')}`,
    dummyVerify: async () => undefined,
  };
};
