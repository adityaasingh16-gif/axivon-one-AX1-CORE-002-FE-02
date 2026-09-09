// resetPassword.js — wire up the reset-password form (arrived at via a
// tokenized link from the forgot-password email).

import { resetPassword } from "../services/authService.js";
import { createFormState } from "../utils/uiState.js";
import { ApiError, NetworkError } from "../utils/apiClient.js";

export function initResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const formEl = document.querySelector("#resetPasswordForm");
  const invalidTokenEl = document.querySelector("#resetTokenInvalid");
  if (!formEl) return;

  if (!token) {
    // No token in the URL at all — don't even show the form.
    formEl.hidden = true;
    if (invalidTokenEl) invalidTokenEl.hidden = false;
    return;
  }

  const submitBtn = formEl.querySelector('[type="submit"]');
  const errorEl = formEl.querySelector("#resetPasswordError");
  const successEl = formEl.querySelector("#resetPasswordSuccess");
  const formState = createFormState({ submitBtn, errorEl });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formState.state === "loading") return;

    const newPassword = formEl.querySelector("#newPassword")?.value;
    const confirmPassword = formEl.querySelector("#confirmPassword")?.value;

    if (!newPassword || newPassword.length < 8) {
      formState.setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      formState.setError("Passwords do not match.");
      return;
    }

    formState.setLoading();
    try {
      await resetPassword({ token, newPassword });
      formState.setSuccess();
      formEl.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = "Your password has been reset. You can now log in.";
      }
      setTimeout(() => window.location.assign("/login.html"), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        // Expired/invalid token typically comes back as 400/401/410 —
        // TODO: confirm the exact status/code the backend uses so this
        // can show a "request a new link" prompt instead of a generic error.
        formState.setError(err.message);
      } else if (err instanceof NetworkError) {
        formState.setError(err.message);
      } else {
        formState.setError("Unexpected error. Please try again.");
      }
    }
  });
}
