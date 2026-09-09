// uiState.js
// Small reusable helper to enforce a consistent idle/loading/success/error
// lifecycle on any form, and to prevent double-submits / layout shift.
//
// Usage in a page module:
//   const formState = createFormState({
//     formEl: document.querySelector("#loginForm"),
//     submitBtn: document.querySelector("#loginSubmit"),
//     errorEl: document.querySelector("#loginError"),
//   });
//
//   formState.setLoading();
//   try {
//     await doThing();
//     formState.setSuccess();
//   } catch (err) {
//     formState.setError(err.message);
//   }

export const STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
});

export function createFormState({ submitBtn, errorEl, submitBtnDefaultText } = {}) {
  let state = STATES.IDLE;
  const defaultText = submitBtnDefaultText || submitBtn?.textContent || "Submit";

  function render() {
    if (submitBtn) {
      // Disable during loading to prevent duplicate/multiple submissions.
      submitBtn.disabled = state === STATES.LOADING;
      // Reserve space via CSS (see auth.css) instead of swapping button
      // size, so the loading indicator doesn't cause layout shift.
      submitBtn.dataset.state = state;
      submitBtn.textContent = state === STATES.LOADING ? "Please wait…" : defaultText;
    }
    if (errorEl) {
      if (state === STATES.ERROR) {
        errorEl.hidden = false;
      } else {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    }
  }

  return {
    get state() {
      return state;
    },
    setIdle() {
      state = STATES.IDLE;
      render();
    },
    setLoading() {
      state = STATES.LOADING;
      render();
    },
    setSuccess() {
      state = STATES.SUCCESS;
      render();
    },
    setError(message) {
      state = STATES.ERROR;
      render();
      if (errorEl) errorEl.textContent = message || "Something went wrong.";
    },
  };
}

/** Renders field-level errors returned by the API (e.g. {email: "..."}) */
export function renderFieldErrors(formEl, fieldErrors) {
  if (!formEl || !fieldErrors) return;
  // Clear previous field errors first.
  formEl.querySelectorAll("[data-field-error]").forEach((el) => {
    el.textContent = "";
    el.hidden = true;
  });
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const el = formEl.querySelector(`[data-field-error="${field}"]`);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  });
}
