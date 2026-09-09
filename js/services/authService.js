// authService.js
// Single centralized place for every auth-related API call.
// Pages/components should import from here — never call fetch/apiRequest
// directly from a page module.
//
// IMPORTANT: The endpoint paths and request/response shapes below are
// placeholders based on common REST auth conventions. They are NOT a
// verified backend contract. Before shipping, confirm each one against
// the real API (route file, API docs, or Postman collection) and update
// AUTH_ENDPOINTS in config.js + the payload shapes here accordingly.

import { apiRequest } from "../utils/apiClient.js";
import { AUTH_ENDPOINTS } from "../config.js";
import { setSession, clearSession } from "../state/authStore.js";

export async function login({ email, password }) {
  const data = await apiRequest(AUTH_ENDPOINTS.login, {
    method: "POST",
    body: { email, password },
  });
  // TODO: confirm actual response shape — assumed { user, accessToken }
  setSession({ user: data.user, accessToken: data.accessToken });
  return data;
}

export async function register({ name, email, password, ...rest }) {
  const data = await apiRequest(AUTH_ENDPOINTS.register, {
    method: "POST",
    body: { name, email, password, ...rest },
  });
  // Some backends auto-login on register; others require email
  // verification first. TODO: confirm which applies here.
  if (data.accessToken) {
    setSession({ user: data.user, accessToken: data.accessToken });
  }
  return data;
}

export async function logout() {
  try {
    await apiRequest(AUTH_ENDPOINTS.logout, { method: "POST" });
  } finally {
    // Always clear client state even if the network call fails —
    // the user should never appear "stuck" logged in locally.
    clearSession();
  }
}

export async function verifyEmail({ token, code }) {
  // TODO: confirm whether verification uses a link token (GET/POST with
  // a token param) or an OTP code entered by the user — payload differs.
  return apiRequest(AUTH_ENDPOINTS.verifyEmail, {
    method: "POST",
    body: token ? { token } : { code },
  });
}

export async function resendVerification({ email }) {
  return apiRequest(AUTH_ENDPOINTS.resendVerification, {
    method: "POST",
    body: { email },
  });
}

export async function forgotPassword({ email }) {
  return apiRequest(AUTH_ENDPOINTS.forgotPassword, {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword({ token, newPassword }) {
  return apiRequest(AUTH_ENDPOINTS.resetPassword, {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function fetchCurrentUser() {
  // Used by authStore.restoreSession() on app start.
  const data = await apiRequest(AUTH_ENDPOINTS.me, { method: "GET" });
  return data.user ?? data;
}
