// config.js
// Central place for environment-driven configuration.
// Do NOT hardcode production URLs or secrets here.
//
// If your project already has a config/env module, delete this file
// and point the imports in services/authService.js at your existing one.

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env && process.env.API_BASE_URL) ||
  window.__ENV__?.API_BASE_URL ||
  "/api"; // fallback: relative path, works with a proxy in dev

// Fill in each path with the real backend route before running the app.
// Leaving any of these blank will cause requests for that flow to hit
// `${API_BASE_URL}` with nothing appended — fill them in first.
export const AUTH_ENDPOINTS = {
  login: "", // e.g. "/auth/login"
  register: "", // e.g. "/auth/register"
  logout: "", // e.g. "/auth/logout"
  verifyEmail: "", // e.g. "/auth/verify-email"
  resendVerification: "", // e.g. "/auth/resend-verification"
  forgotPassword: "", // e.g. "/auth/forgot-password"
  resetPassword: "", // e.g. "/auth/reset-password"
  refreshSession: "", // e.g. "/auth/refresh"
  me: "", // used to restore session on app load, e.g. "/auth/me"
};
