// apiClient.js
// Centralized HTTP client for the whole app. All auth (and other) API
// calls should go through this so token attachment, error shape, and
// 401 handling are consistent everywhere.
//
// If the project already has an HTTP client (e.g. an existing fetch
// wrapper or axios instance), DO NOT duplicate this — merge the
// token-attach / 401-handling logic below into the existing one instead.

import { API_BASE_URL } from "../config.js";

/** Custom error type so UI code can distinguish API errors from bugs. */
export class ApiError extends Error {
  constructor(message, { status, code, fieldErrors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code; // backend-specific error code, if provided
    this.fieldErrors = fieldErrors || null; // { fieldName: "message" }
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error. Please check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

let onUnauthorized = null;
/** Register a callback fired whenever any request gets a 401. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

/**
 * Core request function.
 * - Attaches the session token (if present) as an Authorization header.
 *   If your backend uses httpOnly cookies instead, set `credentials: "include"`
 *   (already done below) and skip the Authorization header — see the
 *   getToken()/attachAuth() TODO.
 * - Normalizes errors into ApiError / NetworkError so callers can
 *   handle them uniformly.
 */
export async function apiRequest(path, { method = "GET", body, headers = {}, signal } = {}) {
  const url = `${API_BASE_URL}${path}`;

  const finalHeaders = {
    "Content-Type": "application/json",
    ...attachAuthHeader(),
    ...headers,
  };

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include", // needed if backend uses httpOnly cookies for session
      signal,
    });
  } catch (err) {
    // fetch throws on network failure / CORS / offline, not on 4xx/5xx
    throw new NetworkError();
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }

    // Never surface raw server error bodies (stack traces, internal
    // messages) to the UI — only a safe, generic-by-default message.
    const safeMessage = safeErrorMessage(response.status, data);

    throw new ApiError(safeMessage, {
      status: response.status,
      code: data?.code,
      fieldErrors: data?.errors || data?.fieldErrors || null,
    });
  }

  return data;
}

function safeErrorMessage(status, data) {
  // Prefer a backend-provided user-facing message if present, but
  // never pass through anything that looks like a stack trace or
  // internal diagnostic text.
  if (data?.message && typeof data.message === "string" && data.message.length < 200) {
    return data.message;
  }

  switch (status) {
    case 400:
      return "That request wasn't valid. Please check the form and try again.";
    case 401:
      return "Invalid credentials or your session has expired.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "That already exists or conflicts with an existing record.";
    case 422:
      return "Some fields need attention.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return status >= 500
        ? "Something went wrong on our end. Please try again shortly."
        : "Something went wrong. Please try again.";
  }
}

// --- Token attachment ---------------------------------------------------
// TODO: Wire this to whatever session storage strategy the existing
// project actually uses. Two common cases:
//
// 1) httpOnly cookie session (backend sets the cookie on login) ->
//    you don't need to attach anything here; `credentials: "include"`
//    above is sufficient. Leave attachAuthHeader() returning {}.
//
// 2) Bearer token stored client-side (e.g. in memory / sessionStorage) ->
//    import the token getter from state/authStore.js and attach it below.
import { getAccessToken } from "../state/authStore.js";

function attachAuthHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
