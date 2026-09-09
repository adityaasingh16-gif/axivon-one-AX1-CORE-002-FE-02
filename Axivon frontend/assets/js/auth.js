/*!
 * AXIVON ONE — client-side auth simulation
 * ------------------------------------------------------------------
 * There is NO server, database, or API behind this. Every "account",
 * "session" and "token" below lives in this browser's localStorage /
 * sessionStorage, purely so the UI flows can be demonstrated end to
 * end. Passwords are put through a trivial, non-cryptographic string
 * hash (NOT bcrypt/argon2/etc) — never reuse this pattern in a real
 * product. Swap the AxivonAuth functions below for real API calls
 * when wiring this UI up to an actual backend.
 * ------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  var LS_USERS = 'axivon_users_v1';
  var LS_SESSION = 'axivon_session_v1';
  var SS_PENDING_EMAIL = 'axivon_pending_verification_email';

  var REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  var SESSION_MS = 60 * 60 * 1000;             // 1 hour (demo-friendly)
  var RESET_TOKEN_MS = 15 * 60 * 1000;         // 15 minutes

  // ---------------------------------------------------------------
  // low level storage helpers
  // ---------------------------------------------------------------
  function readJSON(store, key, fallback) {
    try {
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(store, key, value) {
    store.setItem(key, JSON.stringify(value));
  }

  function getUsers() { return readJSON(localStorage, LS_USERS, []); }
  function saveUsers(users) { writeJSON(localStorage, LS_USERS, users); }

  function nowMs() { return Date.now(); }

  // Trivial demo-only string hash — DO NOT use for real security.
  function demoHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return 'h_' + Math.abs(h).toString(36) + '_' + str.length;
  }

  function genId() {
    return 'usr_' + Math.random().toString(36).slice(2, 10) + nowMs().toString(36);
  }
  function genToken() {
    return Array.from({ length: 4 }, function () {
      return Math.random().toString(36).slice(2, 10);
    }).join('').slice(0, 32);
  }
  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // ---------------------------------------------------------------
  // validators (exposed for use in every form)
  // ---------------------------------------------------------------
  var Validators = {
    email: function (value) {
      var v = (value || '').trim();
      if (!v) return { valid: false, message: 'Email is required.' };
      // pragmatic RFC-5322-ish check
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!re.test(v)) return { valid: false, message: 'Enter a valid email address.' };
      return { valid: true };
    },
    required: function (value, label) {
      if (!value || !String(value).trim()) {
        return { valid: false, message: (label || 'This field') + ' is required.' };
      }
      return { valid: true };
    },
    fullName: function (value) {
      var v = (value || '').trim();
      if (!v) return { valid: false, message: 'Full name is required.' };
      if (v.length < 2) return { valid: false, message: 'Enter your full name.' };
      return { valid: true };
    },
    passwordRules: function (value) {
      var v = value || '';
      return {
        length: v.length >= 8,
        upper: /[A-Z]/.test(v),
        lower: /[a-z]/.test(v),
        number: /[0-9]/.test(v),
        special: /[^A-Za-z0-9]/.test(v)
      };
    },
    passwordValid: function (value) {
      var r = this.passwordRules(value);
      return r.length && r.upper && r.lower && r.number && r.special;
    },
    passwordStrengthScore: function (value) {
      var r = this.passwordRules(value);
      var score = 0;
      ['length', 'upper', 'lower', 'number', 'special'].forEach(function (k) {
        if (r[k]) score++;
      });
      if (value && value.length >= 12) score++;
      return Math.min(score, 5); // 0..5
    },
    passwordsMatch: function (a, b) {
      if (!b) return { valid: false, message: 'Confirm your password.' };
      if (a !== b) return { valid: false, message: 'Passwords do not match.' };
      return { valid: true };
    }
  };

  // ---------------------------------------------------------------
  // account store
  // ---------------------------------------------------------------
  function findUserByEmail(email) {
    var e = (email || '').trim().toLowerCase();
    return getUsers().find(function (u) { return u.email === e; }) || null;
  }

  function registerUser(data) {
    var email = (data.email || '').trim().toLowerCase();
    var users = getUsers();
    if (users.some(function (u) { return u.email === email; })) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    var code = genCode();
    var user = {
      id: genId(),
      fullName: (data.fullName || '').trim(),
      email: email,
      passwordHash: demoHash(data.password),
      verified: false,
      verificationCode: code,
      verificationSentAt: nowMs(),
      resetToken: null,
      resetExpires: null,
      createdAt: nowMs()
    };
    users.push(user);
    saveUsers(users);
    sessionStorage.setItem(SS_PENDING_EMAIL, email);
    return { ok: true, user: user, code: code };
  }

  function setPendingEmail(email) {
    sessionStorage.setItem(SS_PENDING_EMAIL, (email || '').trim().toLowerCase());
  }
  function getPendingEmail() {
    return sessionStorage.getItem(SS_PENDING_EMAIL) || '';
  }
  function clearPendingEmail() {
    sessionStorage.removeItem(SS_PENDING_EMAIL);
  }

  function resendVerification(email) {
    var users = getUsers();
    var user = users.find(function (u) { return u.email === (email || '').trim().toLowerCase(); });
    if (!user) return { ok: false, error: 'No account found for this email.' };
    if (user.verified) return { ok: false, error: 'This account is already verified.' };
    user.verificationCode = genCode();
    user.verificationSentAt = nowMs();
    saveUsers(users);
    return { ok: true, code: user.verificationCode };
  }

  function verifyCode(email, code) {
    var users = getUsers();
    var user = users.find(function (u) { return u.email === (email || '').trim().toLowerCase(); });
    if (!user) return { ok: false, error: 'No account found for this email.' };
    if (user.verified) return { ok: true, alreadyVerified: true };
    if (String(code).trim() !== String(user.verificationCode)) {
      return { ok: false, error: 'That code doesn\u2019t match. Check the digits and try again.' };
    }
    user.verified = true;
    user.verificationCode = null;
    saveUsers(users);
    return { ok: true };
  }

  // ---------------------------------------------------------------
  // session
  // ---------------------------------------------------------------
  function getSession() {
    var s = readJSON(localStorage, LS_SESSION, null);
    if (!s) return null;
    if (nowMs() > s.expiresAt) {
      clearSession();
      return null;
    }
    return s;
  }

  function clearSession() {
    localStorage.removeItem(LS_SESSION);
  }

  function createSession(user, remember) {
    var session = {
      token: genToken(),
      userId: user.id,
      email: user.email,
      remember: !!remember,
      createdAt: nowMs(),
      expiresAt: nowMs() + (remember ? REMEMBER_MS : SESSION_MS),
      userAgent: navigator.userAgent
    };
    writeJSON(localStorage, LS_SESSION, session);
    return session;
  }

  function login(data) {
    var email = (data.email || '').trim().toLowerCase();
    var user = findUserByEmail(email);
    if (!user) {
      return { ok: false, error: 'We couldn\u2019t find an account with that email.' };
    }
    if (user.passwordHash !== demoHash(data.password || '')) {
      return { ok: false, error: 'Incorrect password. Try again.' };
    }
    if (!user.verified) {
      return { ok: false, error: 'Verify your email before logging in.', unverified: true };
    }
    var session = createSession(user, data.remember);
    return { ok: true, session: session, user: user };
  }

  function logout() {
    clearSession();
  }

  function currentUser() {
    var s = getSession();
    if (!s) return null;
    return findUserById(s.userId);
  }
  function findUserById(id) {
    return getUsers().find(function (u) { return u.id === id; }) || null;
  }

  function requireAuth() {
    var s = getSession();
    if (!s) {
      var here = encodeURIComponent(location.pathname.split('/').pop());
      location.replace('login.html?redirect=' + here);
      return null;
    }
    return s;
  }

  function guestOnly() {
    var s = getSession();
    if (s) {
      location.replace('dashboard.html');
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------
  // password reset
  // ---------------------------------------------------------------
  function requestPasswordReset(email) {
    var users = getUsers();
    var e = (email || '').trim().toLowerCase();
    var user = users.find(function (u) { return u.email === e; });
    if (!user) {
      // Intentionally do not reveal whether the account exists.
      return { ok: true, exists: false };
    }
    user.resetToken = genToken();
    user.resetExpires = nowMs() + RESET_TOKEN_MS;
    saveUsers(users);
    return { ok: true, exists: true, token: user.resetToken, expires: user.resetExpires };
  }

  function validateResetToken(email, token) {
    var user = findUserByEmail(email);
    if (!user || !user.resetToken || user.resetToken !== token) {
      return { ok: false, error: 'This reset link is invalid. Request a new one.' };
    }
    if (nowMs() > user.resetExpires) {
      return { ok: false, error: 'This reset link has expired. Request a new one.' };
    }
    return { ok: true, user: user };
  }

  function resetPassword(email, token, newPassword) {
    var check = validateResetToken(email, token);
    if (!check.ok) return check;
    var users = getUsers();
    var user = users.find(function (u) { return u.id === check.user.id; });
    user.passwordHash = demoHash(newPassword);
    user.resetToken = null;
    user.resetExpires = null;
    saveUsers(users);
    // resetting a password invalidates any active session for safety
    var s = getSession();
    if (s && s.email === user.email) clearSession();
    return { ok: true };
  }

  // ---------------------------------------------------------------
  // formatting helpers used across pages
  // ---------------------------------------------------------------
  function formatDateTime(ms) {
    if (!ms) return '\u2014';
    var d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' \u00B7 ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  function initials(name) {
    var parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var first = parts[0][0] || '';
    var last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  global.AxivonAuth = {
    Validators: Validators,
    registerUser: registerUser,
    findUserByEmail: findUserByEmail,
    setPendingEmail: setPendingEmail,
    getPendingEmail: getPendingEmail,
    clearPendingEmail: clearPendingEmail,
    resendVerification: resendVerification,
    verifyCode: verifyCode,
    login: login,
    logout: logout,
    getSession: getSession,
    clearSession: clearSession,
    currentUser: currentUser,
    requireAuth: requireAuth,
    guestOnly: guestOnly,
    requestPasswordReset: requestPasswordReset,
    validateResetToken: validateResetToken,
    resetPassword: resetPassword,
    formatDateTime: formatDateTime,
    initials: initials,
    SESSION_MS: SESSION_MS,
    REMEMBER_MS: REMEMBER_MS
  };
})(window);
