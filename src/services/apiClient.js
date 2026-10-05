const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'web-' + Date.now();
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

export async function apiRequest(path, { token, method = 'GET', body, signal, headers = {}, retry = true } = {}) {
  const response = await fetch(API_BASE_URL + path, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      'X-Request-Id': createRequestId(),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload = await parseBody(response);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      payload?.data?.message ||
      ('API request failed (' + response.status + ')');
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export { API_BASE_URL };
