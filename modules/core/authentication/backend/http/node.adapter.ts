/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Small Node `http` adapter for local development.
 *
 * The auth router intentionally has no Express/Fastify dependency because the
 * framework decision is still `TBD` in the architecture docs. This adapter
 * makes the delivered API runnable today without hiding that decision behind a
 * framework-specific service layer.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { methodNotAllowed, validationError } from '../contracts/errors.js';
import { createErrorResponseFactory } from './error.handler.js';
import { resolveRequestId, securityHeaders } from './middleware.js';
import type { AuthRouter } from './auth.routes.js';
import type { HttpMethod, HttpRequest, HttpResponse } from './types.js';

const MAX_BODY_BYTES = 1024 * 1024;

export interface NodeAdapterOptions {
  router: AuthRouter;
  /** Optional logger for malformed bodies and adapter failures. */
  logger?: (entry: Record<string, unknown>) => void;
  maxBodyBytes?: number;
}

/**
 * Attaches the router to a Node HTTP server's request callback.
 * The caller owns the server lifecycle (`listen`, `close`).
 */
export const createNodeRequestHandler = (options: NodeAdapterOptions) => {
  const errors = createErrorResponseFactory({
    logger: { error: (entry) => options.logger?.(entry) },
  });
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;

  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const requestId = getRequestId(request);
    const bodyResult = await readJsonBody(request, maxBodyBytes);

    if (!bodyResult.ok) {
      writeResponse(
        response,
        errors.fromError(
          validationError([{ field: 'body', issue: bodyResult.error.message }]),
          requestId,
        ),
        requestId,
      );
      return;
    }

    const method = toHttpMethod(request.method);
    if (method === undefined) {
      writeResponse(
        response,
        errors.fromError(methodNotAllowed(), requestId),
        requestId,
      );
      return;
    }

    const httpRequest: HttpRequest = {
      method,
      path: request.url ?? '/',
      headers: flattenHeaders(request.headers),
      body: bodyResult.body,
      ipAddress: request.socket.remoteAddress,
      userAgent: headerValue(request.headers['user-agent']),
      requestId,
    };

    try {
      const result = await options.router.handle(httpRequest);
      writeResponse(response, result, requestId);
    } catch (error) {
      writeResponse(response, errors.fromError(error, requestId), requestId);
    }
  };
};

const toHttpMethod = (value: string | undefined): HttpMethod | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const method = value.toUpperCase();
  const supported: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  return supported.includes(method as HttpMethod) ? (method as HttpMethod) : undefined;
};

const flattenHeaders = (headers: IncomingMessage['headers']): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return result;
};

const headerValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const getRequestId = (request: IncomingMessage): string => {
  const supplied = headerValue(request.headers['x-request-id'])?.trim();
  if (supplied !== undefined && /^[A-Za-z0-9._-]{8,128}$/.test(supplied)) {
    return supplied;
  }
  return `req_${randomUUID()}`;
};

type BodyResult =
  | { ok: true; body: unknown }
  | { ok: false; error: Error };

const readJsonBody = (request: IncomingMessage, maxBytes: number): Promise<BodyResult> =>
  new Promise((resolve) => {
    const method = request.method?.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      resolve({ ok: true, body: undefined });
      return;
    }

    const chunks: Buffer[] = [];
    let bytes = 0;
    let settled = false;

    const fail = (error: Error): void => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, error });
      }
    };

    request.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > maxBytes) {
        fail(new Error('request body exceeds the allowed size'));
        request.resume();
        return;
      }
      chunks.push(buffer);
    });

    request.on('error', (error) => fail(error));
    request.on('end', () => {
      if (settled) {
        return;
      }
      settled = true;
      if (bytes === 0) {
        resolve({ ok: true, body: undefined });
        return;
      }

      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve({ ok: true, body: JSON.parse(raw) as unknown });
      } catch {
        resolve({ ok: false, error: new Error('request body must contain valid JSON') });
      }
    });
  });

const writeResponse = (
  response: ServerResponse,
  result: HttpResponse,
  requestId: string,
): void => {
  response.statusCode = result.status;
  const headers = { ...securityHeaders(), ...result.headers, 'X-Request-Id': requestId };
  for (const [key, value] of Object.entries(headers)) {
    response.setHeader(key, value);
  }

  if (result.status === 204 || result.body === null) {
    response.end();
    return;
  }

  response.end(JSON.stringify(result.body));
};

/** Exported for adapter tests and framework adapters. */
export { resolveRequestId };
