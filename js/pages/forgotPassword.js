// forgotPassword.js — wire up the "forgot password" request form.

import { forgotPassword } from "../services/authService.js";
import { createFormState } from "../utils/uiState.js";
import { ApiError, NetworkError } from "../utils/apiClient.js";

export function initForgotPasswordPage() {
  const formEl = document.querySelector("#forgotPasswordForm");
  if (!formEl) return;

  const submitBtn = formEl.querySelector('[type="submit"]');
  const errorEl = formEl.querySelector("#forgotPasswordError");
  const successEl = formEl.querySelector("#forgotPasswordSuccess");
  const formState = createFormState({ submitBtn, errorEl });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formState.state === "loading") return;

    const email = formEl.querySelector("#email")?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formState.setError("Please enter a valid email address.");
      return;
    }

    formState.setLoading();
    try {
      await forgotPassword({ email });
      formState.setSuccess();
      formEl.hidden = true;
      if (successEl) {
        successEl.hidden = false;
        // Deliberately generic message — do not confirm/deny whether the
        // email exists in the system, to avoid account enumeration.
        successEl.textContent =
          "If an account exists for that email, a reset link has been sent.";
      }
    } catch (err) {
      if (err instanceof ApiError) {
        formState.setError(err.message);
      } else if (err instanceof NetworkError) {
        formState.setError(err.message);
      } else {
        formState.setError("Unexpected error. Please try again.");
      }
    }
  });
}
