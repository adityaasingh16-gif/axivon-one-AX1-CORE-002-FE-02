// register.js — wire up the registration form.
// TODO: adjust selectors and field list to match the actual register.html
// markup and required backend fields (e.g. role: rider/driver, phone, etc.)

import { register } from "../services/authService.js";
import { createFormState, renderFieldErrors } from "../utils/uiState.js";
import { ApiError, NetworkError } from "../utils/apiClient.js";
import { redirectIfAuthenticated } from "../guards/routeGuard.js";

export function initRegisterPage() {
  if (redirectIfAuthenticated()) return;

  const formEl = document.querySelector("#registerForm");
  if (!formEl) return;

  const submitBtn = formEl.querySelector('[type="submit"]');
  const errorEl = formEl.querySelector("#registerError");
  const formState = createFormState({ submitBtn, errorEl });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formState.state === "loading") return;

    const name = formEl.querySelector("#name")?.value.trim();
    const email = formEl.querySelector("#email")?.value.trim();
    const password = formEl.querySelector("#password")?.value;
    const confirmPassword = formEl.querySelector("#confirmPassword")?.value;

    const validationError = validate({ name, email, password, confirmPassword });
    if (validationError) {
      formState.setError(validationError);
      return;
    }

    formState.setLoading();
    try {
      const data = await register({ name, email, password });
      formState.setSuccess();

      // TODO: confirm actual post-registration flow with the backend —
      // some send an email/OTP requiring verification before login is
      // possible, others auto-login immediately.
      if (data.requiresVerification) {
        window.location.assign(`/verify-email.html?email=${encodeURIComponent(email)}`);
      } else {
        window.location.assign("/app/dashboard.html");
      }
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

function validate({ name, email, password, confirmPassword }) {
  if (!name || !email || !password || !confirmPassword) {
    return "Please fill in all required fields.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}
