// authStore.js
// Single source of truth for auth/session state on the client.
// Simple pub/sub so any part of the vanilla-JS app (nav bar, route
// guard, etc.) can react to login/logout without a framework.
//
// TODO: If the project already has a global state module, merge this
// into it instead of introducing a second state system.

const STORAGE_KEY = "app_auth_session"; // sessionStorage, not localStorage:
// tokens shouldn't outlive the browser tab longer than necessary.
// Switch to localStorage only if the product explicitly wants
// "remember me" persistence across tab closes, and only for a
// refresh token, never a long-lived access token.

let state = {
  user: null, // { id, name, email, ... } — never store the token itself here
  accessToken: null,
  status: "idle", // "idle" | "restoring" | "authenticated" | "unauthenticated"
};

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function getAccessToken() {
  return state.accessToken;
}

export function isAuthenticated() {
  return state.status === "authenticated";
}

/** Called after successful login/registration/verification. */
export function setSession({ user, accessToken }) {
  state = { ...state, user, accessToken, status: "authenticated" };
  persist();
  notify();
}

/** Called on logout or when a 401 forces the session to end. */
export function clearSession() {
  state = { user: null, accessToken: null, status: "unauthenticated" };
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable (e.g. privacy mode) — ignore.
  }
  notify();
}

function persist() {
  try {
    // Persist only what's needed to attempt session restore — never log
    // this value, and avoid storing anything beyond what's necessary.
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: state.accessToken, user: state.user })
    );
  } catch {
    // Storage may be full or unavailable — session still works for this
    // page load via in-memory state, just won't survive a refresh.
  }
}

/**
 * Attempts to restore a session on app start. Two supported strategies —
 * keep whichever matches the existing backend contract and delete the other:
 *
 * A) Token restored from sessionStorage, then validated against /auth/me.
 * B) Cookie-based session: skip local storage entirely and just call
 *    /auth/me — the browser sends the httpOnly cookie automatically.
 */
export async function restoreSession(fetchCurrentUser) {
  state = { ...state, status: "restoring" };
  notify();

  let cached = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    cached = raw ? JSON.parse(raw) : null;
  } catch {
    cached = null;
  }

  if (cached?.accessToken) {
    state = { ...state, accessToken: cached.accessToken };
  }

  try {
    const user = await fetchCurrentUser(); // GET /auth/me — see authService.js
    state = { ...state, user, status: "authenticated" };
    notify();
    return true;
  } catch {
    clearSession();
    return false;
  }
}
