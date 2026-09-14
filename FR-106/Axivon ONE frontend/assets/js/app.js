/*!
 * AXIVON ONE — shared UI helpers
 */
(function (global) {
  'use strict';

  var ICONS = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12.5L9.5 18L20 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8.5V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.3" r="1.1" fill="currentColor"/><path d="M10.6 3.7c.6-1 2.2-1 2.8 0l8.3 14.4c.6 1-.2 2.3-1.4 2.3H3.7c-1.2 0-2-1.3-1.4-2.3L10.6 3.7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1" fill="currentColor"/></svg>',
    key: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="8.2" cy="15.8" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M11.3 12.7 19 5m0 0v3.3M19 5h-3.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function icon(name) { return ICONS[name] || ''; }

  // ---------------- alerts ----------------
  function showAlert(container, type, title, message) {
    if (!container) return;
    container.classList.remove('alert-hidden');
    container.className = 'alert alert-' + type;
    container.innerHTML =
      '<span aria-hidden="true">' + icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info') + '</span>' +
      '<span>' + (title ? '<strong>' + title + '</strong>' : '') +
      (message ? '<p>' + message + '</p>' : '') + '</span>';
  }
  function hideAlert(container) {
    if (!container) return;
    container.classList.add('alert-hidden');
    container.innerHTML = '';
  }

  // ---------------- field errors ----------------
  function setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    fieldEl.classList.add('has-error');
    fieldEl.classList.remove('has-success');
    var err = fieldEl.querySelector('.error-text');
    if (err) err.textContent = message || '';
    var input = fieldEl.querySelector('.input');
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  function clearFieldError(fieldEl, markSuccess) {
    if (!fieldEl) return;
    fieldEl.classList.remove('has-error');
    var err = fieldEl.querySelector('.error-text');
    if (err) err.textContent = '';
    var input = fieldEl.querySelector('.input');
    if (input) input.removeAttribute('aria-invalid');
    if (markSuccess) fieldEl.classList.add('has-success');
    else fieldEl.classList.remove('has-success');
  }

  // ---------------- button loading/disabled ----------------
  function setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn.classList.add('is-loading');
      btn.disabled = true;
      if (!btn.querySelector('.spinner')) {
        var s = document.createElement('span');
        s.className = 'spinner';
        btn.appendChild(s);
      }
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }

  // ---------------- password visibility ----------------
  function bindPasswordToggle(toggleBtn, input) {
    if (!toggleBtn || !input) return;
    toggleBtn.addEventListener('click', function () {
      var isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
      toggleBtn.innerHTML = isPw
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.7a2.6 2.6 0 0 0 3.7 3.6M6.5 6.7C4.3 8.2 2.7 10.3 2 12c1.6 3.8 5.6 7 10 7 1.6 0 3.1-.4 4.5-1.1M9.9 4.2A10.6 10.6 0 0 1 12 4c4.4 0 8.4 3.2 10 7-.5 1.2-1.3 2.5-2.3 3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 12c1.6-3.8 5.6-7 10-7s8.4 3.2 10 7c-1.6 3.8-5.6 7-10 7s-8.4-3.2-10-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>';
      input.focus();
    });
  }

  // ---------------- password checklist / meter ----------------
  function bindPasswordMeter(input, checklistEl, meterFillEl) {
    if (!input) return;
    function update() {
      var v = input.value;
      var rules = global.AxivonAuth.Validators.passwordRules(v);
      if (checklistEl) {
        Object.keys(rules).forEach(function (key) {
          var li = checklistEl.querySelector('[data-rule="' + key + '"]');
          if (li) li.classList.toggle('is-met', rules[key]);
        });
      }
      if (meterFillEl) {
        var score = global.AxivonAuth.Validators.passwordStrengthScore(v);
        var pct = (score / 5) * 100;
        meterFillEl.style.width = pct + '%';
        var color = score <= 2 ? 'var(--error)' : score <= 3 ? '#C08A3E' : 'var(--success)';
        meterFillEl.style.backgroundColor = color;
      }
    }
    input.addEventListener('input', update);
    update();
  }

  // ---------------- toast ----------------
  function ensureToastHost() {
    var host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(message, opts) {
    opts = opts || {};
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span aria-hidden="true">' + icon(opts.icon || 'check') + '</span><span>' + message + '</span>';
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 220);
    }, opts.duration || 3200);
  }

  // ---------------- misc ----------------
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  global.AxivonUI = {
    icon: icon,
    showAlert: showAlert,
    hideAlert: hideAlert,
    setFieldError: setFieldError,
    clearFieldError: clearFieldError,
    setLoading: setLoading,
    bindPasswordToggle: bindPasswordToggle,
    bindPasswordMeter: bindPasswordMeter,
    toast: toast,
    qs: qs,
    debounce: debounce
  };
})(window);
