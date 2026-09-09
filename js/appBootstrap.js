// appBootstrap.js — entry point to wire everything together.
// TODO: merge this into the project's actual app entry file (main.js /
// index.js / app.js) rather than loading it standalone, if one exists.

import { restoreSession } from "./state/authStore.js";
import { fetchCurrentUser } from "./services/authService.js";
import { setUnauthorizedHandler } from "./utils/apiClient.js";
import { clearSession } from "./state/authStore.js";
import { requireAuth, watchSessionAndRedirect } from "./guards/routeGuard.js";

import { initLoginPage } from "./pages/login.js";
import { initRegisterPage } from "./pages/register.js";
import { initVerifyEmailPage } from "./pages/verifyEmail.js";
import { initForgotPasswordPage } from "./pages/forgotPassword.js";
import { initResetPasswordPage } from "./pages/resetPassword.js";
import { initLogoutButtons } from "./pages/logout.js";

async function bootstrap() {
  // Any 401 from anywhere in the app should end the session locally too.
  setUnauthorizedHandler(() => clearSession());

  await restoreSession(fetchCurrentUser);
  watchSessionAndRedirect();

  // Each init*Page() function no-ops if its form isn't present on the
  // current page, so it's safe to call all of them from one shared entry
  // script included on every page.
  initLoginPage();
  initRegisterPage();
  initVerifyEmailPage();
  initForgotPasswordPage();
  initResetPasswordPage();
  initLogoutButtons();

  // TODO: adjust this prefix check to match the real protected-route
  // structure, or call requireAuth() explicitly at the top of each
  // protected page's own script instead of doing it centrally here.
  if (window.location.pathname.startsWith("/app/")) {
    requireAuth();
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
