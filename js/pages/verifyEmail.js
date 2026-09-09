// verifyEmail.js — handles both link-based (?token=...) and OTP-code
// verification flows. TODO: confirm which one the backend actually uses
// and delete the branch that doesn't apply.

import { verifyEmail, resendVerification } from "../services/authService.js";
import { createFormState } from "../utils/uiState.js";
import { ApiError, NetworkError } from "../utils/apiClient.js";

export function initVerifyEmailPage() {
  const params = new URLSearchParams(window.location.search);
  const linkToken = params.get("token");
  const email = params.get("email");

  const statusEl = document.querySelector("#verifyStatus");
  const otpForm = document.querySelector("#otpForm");

  // Case A: link-based verification — verify immediately on page load.
  if (linkToken) {
    runLinkVerification(linkToken, statusEl);
    return;
  }

  // Case B: OTP-code verification — user types the code they received.
  if (otpForm) {
    initOtpForm(otpForm, email);
  }
}

async function runLinkVerification(token, statusEl) {
  if (statusEl) statusEl.textContent = "Verifying your account…";
  try {
    await verifyEmail({ token });
    if (statusEl) statusEl.textContent = "Your account is verified! You can now log in.";
    setTimeout(() => window.location.assign("/login.html"), 1500);
  } catch (err) {
    if (statusEl) {
      statusEl.textContent =
        err instanceof ApiError
          ? "This verification link is invalid or has expired. Please request a new one."
          : "Something went wrong verifying your account. Please try again.";
    }
  }
}

function initOtpForm(formEl, email) {
  const submitBtn = formEl.querySelector('[type="submit"]');
  const errorEl = formEl.querySelector("#otpError");
  const formState = createFormState({ submitBtn, errorEl });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formState.state === "loading") return;

    const code = formEl.querySelector("#otpCode")?.value.trim();
    if (!code) {
      formState.setError("Please enter the code you received.");
      return;
    }

    formState.setLoading();
    try {
      await verifyEmail({ code });
      formState.setSuccess();
      window.location.assign("/login.html");
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

  const resendBtn = document.querySelector("#resendCode");
  if (resendBtn && email) {
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      try {
        await resendVerification({ email });
        resendBtn.textContent = "Code sent!";
      } catch {
        resendBtn.textContent = "Couldn't resend — try again";
      } finally {
        setTimeout(() => {
          resendBtn.disabled = false;
          resendBtn.textContent = "Resend code";
        }, 5000);
      }
    });
  }
}
