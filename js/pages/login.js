// login.js — wire up the login form.
// TODO: adjust selectors to match the actual login.html markup.

import { login } from "../services/authService.js";
import { createFormState, renderFieldErrors } from "../utils/uiState.js";
import { ApiError, NetworkError } from "../utils/apiClient.js";
import { redirectIfAuthenticated } from "../guards/routeGuard.js";

export function initLoginPage() {
  if (redirectIfAuthenticated()) return; // already logged in, no need to show this page

  const formEl = document.querySelector("#loginForm");
  if (!formEl) return; // not on this page

  const submitBtn = formEl.querySelector('[type="submit"]');
  const errorEl = formEl.querySelector("#loginError");
  const formState = createFormState({ submitBtn, errorEl });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formState.state === "loading") return; // guard against double submit

    const email = formEl.querySelector("#email")?.value.trim();
    const password = formEl.querySelector("#password")?.value;

    if (!email || !password) {
      formState.setError("Please enter both email and password.");
      return;
    }

    formState.setLoading();
    try {
      await login({ email, password });
      formState.setSuccess();
      // TODO: confirm the actual post-login destination (dashboard, a
      // `redirect` query param carried over from a protected route, etc.)
      const params = new URLSearchParams(window.location.search);
      window.location.assign(params.get("redirect") || "/app/dashboard.html");
    } catch (err) {
      if (err instanceof ApiError) {
        formState.setError(err.message);
        renderFieldErrors(formEl, err.fieldErrors);
      } else if (err instanceof NetworkError) {
        formState.setError(err.message);
      } else {
        formState.setError("Unexpected error. Please try again.");
      }
    }
  });
}
