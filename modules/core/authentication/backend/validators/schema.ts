/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Minimal declarative validator.
 *
 * `07-API-SPECIFICATION.md` §15: input validation is structural, runs before
 * any business logic, and failures return `422` with field-level `details`.
 * It also requires validation to live in a *shared layer* rather than being
 * reimplemented per module — this file is that layer for auth, and it is
 * written so the whole thing can be replaced by `@axivon/validation` (or zod)
 * without changing a single call site in the controller.
 *
 * `toJsonSchema()` exists so the same definition can later be published as the
 * documented contract (`07-API-SPECIFICATION.md` §31) instead of drifting from it.
 */

import { isEmailValid } from '../../../../../packages/validation/src/index.js';
import { validationError } from '../contracts/errors.js';
import type { ValidationIssue } from '../contracts/index.js';

type Rule = (value: string, field: string) => ValidationIssue | null;

const requiredString =
  (options: { min: number; max: number }): Rule =>
  (value, field) => {
    if (value.trim().length === 0) {
      return { field, issue: 'is required' };
    }
    const trimmed = value.trim();
    if (trimmed.length < options.min) {
      return { field, issue: `must be at least ${options.min} characters` };
    }
    if (trimmed.length > options.max) {
      return { field, issue: `must be at most ${options.max} characters` };
    }
    return null;
  };

const emailRule = (): Rule => (value, field) => {
  const base = requiredString({ min: 5, max: 254 })(value, field);
  if (base !== null) {
    return base;
  }
  // Reuses the platform-wide email rule from `@axivon/validation` so auth does
  // not invent a second, subtly different definition of a valid email.
  return isEmailValid(value.trim()) ? null : { field, issue: 'must be a valid email address' };
};

const passwordRule =
  (options: { minLength: number; maxLength: number }): Rule =>
  (value, field) => {
    if (value.length === 0) {
      return { field, issue: 'is required' };
    }
    if (value.length < options.minLength) {
      return { field, issue: `must be at least ${options.minLength} characters` };
    }
    if (value.length > options.maxLength) {
      return { field, issue: `must be at most ${options.maxLength} characters` };
    }
    if (/\s/.test(value)) {
      return { field, issue: 'must not contain whitespace' };
    }
    if (!/[A-Za-z]/.test(value)) {
      return { field, issue: 'must contain at least one letter' };
    }
    if (!/[0-9]/.test(value)) {
      return { field, issue: 'must contain at least one number' };
    }
    return null;
  };

const tokenRule = (): Rule => (value, field) => {
  if (value.trim().length === 0) {
    return { field, issue: 'is required' };
  }
  // base64url alphabet only; the bounds stop a multi-megabyte body reaching scrypt.
  if (!/^[A-Za-z0-9_-]{16,512}$/.test(value.trim())) {
    return { field, issue: 'must be a valid token' };
  }
  return null;
};

const sessionIdRule = (): Rule => (value, field) => {
  if (value.trim().length === 0) {
    return { field, issue: 'is required' };
  }
  if (!/^[A-Za-z0-9-]{8,64}$/.test(value.trim())) {
    return { field, issue: 'must be a valid session identifier' };
  }
  return null;
};

const refreshTokenRule = (): Rule => (value, field) => {
  if (value.trim().length === 0) {
    return { field, issue: 'is required' };
  }
  if (value.length > 4096) {
    return { field, issue: 'must be a valid token' };
  }
  return null;
};

const authorizationRule = (): Rule => (value, field) => {
  if (value.trim().length === 0) {
    return { field, issue: 'is required' };
  }
  if (!/^Bearer\s+[A-Za-z0-9._-]{16,4096}$/i.test(value.trim())) {
    return { field, issue: 'must be a Bearer access token' };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Object schema
// ---------------------------------------------------------------------------

export interface FieldSpec<T> {
  /** Returns the parsed value, or an issue whose `field` is filled by the object parser. */
  parse(value: unknown): T | ValidationIssue;
  optional?: boolean;
  jsonSchema?: Record<string, unknown>;
}

const isIssue = (value: unknown): value is ValidationIssue =>
  typeof value === 'object' &&
  value !== null &&
  'field' in value &&
  'issue' in value &&
  typeof (value as ValidationIssue).issue === 'string';

const defineField = <T>(
  rule: Rule,
  options: {
    optional?: boolean;
    jsonSchema?: Record<string, unknown>;
    /** Post-parse transform, e.g. lowercasing an email. */
    transform?: (value: string) => T;
  } = {},
): FieldSpec<T> => ({
  optional: options.optional,
  jsonSchema: options.jsonSchema,
  parse: (value: unknown): T | ValidationIssue => {
    if (value === undefined || value === null) {
      return options.optional === true
        ? (undefined as unknown as T)
        : { field: '', issue: 'is required' };
    }
    if (typeof value !== 'string') {
      return { field: '', issue: 'must be a string' };
    }
    const issue = rule(value, '');
    if (issue !== null) {
      return issue;
    }
    const transform = options.transform;
    return transform === undefined ? ((value as unknown) as T) : transform(value);
  },
});

/** `Required<T>`-style helper: fields marked optional become `T | undefined`. */
export type InferObject<TShape extends Record<string, FieldSpec<unknown>>> = {
  [K in keyof TShape]: TShape[K] extends FieldSpec<infer T>
    ? TShape[K]['optional'] extends true
      ? T | undefined
      : T
    : never;
};

/**
 * Builds a parser for a flat JSON object.
 * Unknown keys are ignored rather than rejected: `07-API-SPECIFICATION.md` §12
 * says server-managed fields supplied by the client are ignored or rejected —
 * auth ignores them (the `organizationId` rejection in the service is a
 * security decision, not a shape decision).
 */
export const defineObject = <TShape extends Record<string, FieldSpec<unknown>>>(shape: TShape) => {
  const entries = Object.entries(shape) as [string, FieldSpec<unknown>][];

  return {
    shape,

    parse: (input: unknown): InferObject<TShape> => {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw validationError([{ field: 'body', issue: 'must be a JSON object' }]);
      }

      const source = input as Record<string, unknown>;
      const issues: ValidationIssue[] = [];
      const result: Record<string, unknown> = {};

      for (const [key, spec] of entries) {
        const parsed = spec.parse(source[key]);
        if (isIssue(parsed)) {
          issues.push({ field: key, issue: parsed.issue });
          continue;
        }
        if (parsed !== undefined) {
          result[key] = parsed;
        }
      }

      if (issues.length > 0) {
        throw validationError(issues);
      }
      return result as InferObject<TShape>;
    },

    /**
     * Emits the JSON Schema for this object so the published API reference and
     * the runtime validator cannot drift apart (§31).
     */
    toJsonSchema: (): Record<string, unknown> => {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, spec] of entries) {
        properties[key] = spec.jsonSchema ?? { type: 'string' };
        if (spec.optional !== true) {
          required.push(key);
        }
      }

      return { type: 'object', properties, required, additionalProperties: false };
    },
  };
};

const EMAIL_TRANSFORM = (value: string): string => value.trim().toLowerCase();
const TRIM_TRANSFORM = (value: string): string => value.trim();

export const authValidators = {
  email: (): FieldSpec<string> =>
    defineField(emailRule(), {
      transform: EMAIL_TRANSFORM,
      jsonSchema: { type: 'string', format: 'email', minLength: 5, maxLength: 254 },
    }),

  password: (options: { minLength: number; maxLength: number }): FieldSpec<string> =>
    defineField(passwordRule(options), {
      jsonSchema: {
        type: 'string',
        minLength: options.minLength,
        maxLength: options.maxLength,
        format: 'password',
      },
    }),

  /** Login accepts any non-empty password; complexity is a registration rule. */
  loginPassword: (): FieldSpec<string> =>
    defineField(requiredString({ min: 1, max: 256 }), {
      jsonSchema: { type: 'string', minLength: 1, maxLength: 256, format: 'password' },
    }),

  firstName: (): FieldSpec<string> =>
    defineField(requiredString({ min: 1, max: 100 }), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', minLength: 1, maxLength: 100 },
    }),

  lastName: (): FieldSpec<string> =>
    defineField(requiredString({ min: 1, max: 100 }), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', minLength: 1, maxLength: 100 },
    }),

  token: (): FieldSpec<string> =>
    defineField(tokenRule(), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', minLength: 16, maxLength: 512 },
    }),

  refreshToken: (): FieldSpec<string> =>
    defineField(refreshTokenRule(), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', maxLength: 4096 },
    }),

  sessionId: (): FieldSpec<string> =>
    defineField(sessionIdRule(), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', minLength: 8, maxLength: 64 },
    }),

  authorization: (): FieldSpec<string> =>
    defineField(authorizationRule(), {
      transform: TRIM_TRANSFORM,
      jsonSchema: { type: 'string', pattern: '^Bearer .+$' },
    }),
};
