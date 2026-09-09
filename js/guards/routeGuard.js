// routeGuard.js
// Lightweight route protection for a vanilla multi-page (or SPA-lite) app.
// Adjust to your actual routing approach (plain multi-page HTML files vs
// a client-side router) — the logic is the same either way.

import { isAuthenticated, getState, subscribe } from "../state/authStore.js";

const PUBLIC_ONLY_PAGES = ["/login.html", "/register.html", "/forgot-password.html"];
const PROTECTED_PAGES_PREFIX = "/app/"; // TODO: adjust to match real folder/route structure

/**
 * Call this at the top of any protected page's entry script, after
 * restoreSession() has resolved.
 */
export function requireAuth(redirectTo = "/login.html") {
  if (!isAuthenticated()) {
    window.location.replace(redirectTo);
    return false;
  }
  return true;
}

/**
 * Call this at the top of login/register/forgot-password pages so an
 * already-authenticated user isn't shown them unnecessarily.
 */
export function redirectIfAuthenticated(redirectTo = "/app/dashboard.html") {
  if (isAuthenticated()) {
    window.location.replace(redirectTo);
    return true;
  }
  return false;
}

/**
 * Optional: keep guarding reactively (e.g. if a 401 clears the session
 * while the user is mid-session on a protected page).
 */
export function watchSessionAndRedirect({ loginPage = "/login.html" } = {}) {
  subscribe((state) => {
    const onProtectedPage = window.location.pathname.startsWith(PROTECTED_PAGES_PREFIX);
    if (onProtectedPage && state.status === "unauthenticated") {
      window.location.replace(loginPage);
    }
  });
}
