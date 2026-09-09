// logout.js — attach to any "Logout" button anywhere in the app
// (nav bar, dropdown menu, etc.)

import { logout } from "../services/authService.js";

export function initLogoutButtons(selector = "[data-logout]") {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (btn.disabled) return; // prevent double-click firing logout twice
      btn.disabled = true;

      try {
        await logout();
      } catch {
        // logout() already clears local state in its `finally` block even
        // if the network call fails — nothing else to do here.
      } finally {
        // TODO: confirm the correct public landing page for this project.
        window.location.assign("/login.html");
      }
    });
  });
}
