/*!
 * AXIVON ONE — Day 2: User Management module
 * ------------------------------------------------------------------
 * Frontend-only. No backend, no real API. "Users" here are a mock
 * business dataset (profiles/status/membership) stored under their
 * own localStorage key, completely separate from Day 1's auth
 * accounts/sessions (axivon_users_v1 / axivon_session_v1 in auth.js).
 *
 * Exposes window.AxivonUsers with:
 *   - State: a single mutable object other pages read/write
 *   - Data layer: list/get/create/update/remove (mock, localStorage)
 *   - Validators: for the create/edit form
 *   - Render helpers: reusable "component-like" functions used by
 *     users.html / user-details.html / user-form.html so markup and
 *     logic for badges/rows/states are written once.
 * ------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  var LS_MANAGED_USERS = 'axivon_managed_users_v1';

  var STATUSES = ['active', 'pending', 'inactive', 'suspended', 'banned'];
  var MEMBERSHIPS = ['free', 'basic', 'pro', 'enterprise'];

  var STATUS_LABEL = { active: 'Active', pending: 'Pending', inactive: 'Inactive', suspended: 'Suspended', banned: 'Banned' };
  var STATUS_BADGE_CLASS = { active: 'badge-success', pending: 'badge-info', inactive: 'badge-neutral', suspended: 'badge-danger', banned: 'badge-danger' };

  var MEMBERSHIP_LABEL = { free: 'Free', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };
  var MEMBERSHIP_BADGE_CLASS = { free: 'badge-neutral', basic: 'badge-info', pro: 'badge-brass', enterprise: 'badge-ink' };

  // ---------------------------------------------------------------
  // low-level storage helpers
  // ---------------------------------------------------------------
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function nowMs() { return Date.now(); }
  function genId() {
    return 'mu_' + Math.random().toString(36).slice(2, 9) + nowMs().toString(36);
  }

  // ---------------------------------------------------------------
  // mock seed data (only used the very first time this loads)
  // ---------------------------------------------------------------
  var SEED_NAMES = [
    ['Amelia Fontaine', 'amelia.fontaine@axivon.dev', 'Product Design', 'Lead Designer'],
    ['Rowan Achebe', 'rowan.achebe@axivon.dev', 'Engineering', 'Backend Engineer'],
    ['Priya Natarajan', 'priya.natarajan@axivon.dev', 'Engineering', 'Frontend Engineer'],
    ['Marcus Lindqvist', 'marcus.lindqvist@axivon.dev', 'Sales', 'Account Executive'],
    ['Elena Marchetti', 'elena.marchetti@axivon.dev', 'Customer Success', 'CS Manager'],
    ['Tobias Reinholt', 'tobias.reinholt@axivon.dev', 'Engineering', 'DevOps Engineer'],
    ['Ingrid Solvang', 'ingrid.solvang@axivon.dev', 'Marketing', 'Content Strategist'],
    ['Kwame Boateng', 'kwame.boateng@axivon.dev', 'Finance', 'Financial Analyst'],
    ['Yuki Tanaka', 'yuki.tanaka@axivon.dev', 'Product Design', 'UX Researcher'],
    ['Sofia Bergstrom', 'sofia.bergstrom@axivon.dev', 'Engineering', 'QA Engineer'],
    ['Diego Valderrama', 'diego.valderrama@axivon.dev', 'Sales', 'Sales Ops'],
    ['Nadia Osei', 'nadia.osei@axivon.dev', 'People Ops', 'Recruiter']
  ];

  function seedUsers() {
    var base = nowMs();
    return SEED_NAMES.map(function (row, i) {
      return {
        id: genId(),
        fullName: row[0],
        email: row[1],
        department: row[2],
        jobTitle: row[3],
        phone: '',
        bio: '',
        status: STATUSES[i % STATUSES.length],
        membership: MEMBERSHIPS[(i + 1) % MEMBERSHIPS.length],
        createdAt: base - (i + 1) * 1000 * 60 * 60 * 24 * (i + 3),
        updatedAt: base - (i + 1) * 1000 * 60 * 60 * 24 * (i + 3)
      };
    });
  }

  function syncAuthAccounts(users) {
    var authAccounts = readJSON('axivon_users_v1', []);
    if (!Array.isArray(authAccounts)) return users;
    var byEmail = {};
    users.forEach(function (u) { byEmail[(u.email || '').toLowerCase()] = u; });
    authAccounts.forEach(function (a) {
      var email = (a.email || '').toLowerCase();
      if (!email) return;
      var existing = byEmail[email];
      if (existing) {
        existing.fullName = a.fullName || existing.fullName;
        existing.authAccount = true;
        existing.verified = !!a.verified;
        if (!existing.status || existing.status === 'pending') existing.status = a.verified ? 'active' : 'pending';
        return;
      }
      var user = {
        id: a.id || genId(), fullName: a.fullName || email.split('@')[0], email: email,
        department: '—', jobTitle: 'Account User', phone: '', bio: '',
        status: a.verified ? 'active' : 'pending', membership: 'free',
        verified: !!a.verified, authAccount: true, createdAt: a.createdAt || nowMs(), updatedAt: nowMs()
      };
      users.unshift(user); byEmail[email] = user;
    });
    return users;
  }

  function getAll() {
    var existing = readJSON(LS_MANAGED_USERS, null);
    if (!existing) existing = seedUsers();
    existing = syncAuthAccounts(existing);
    writeJSON(LS_MANAGED_USERS, existing);
    return existing;
  }
  function saveAll(users) { writeJSON(LS_MANAGED_USERS, users); }

  function getById(id) {
    return getAll().find(function (u) { return u.id === id; }) || null;
  }

  function emailTaken(email, excludeId) {
    var e = (email || '').trim().toLowerCase();
    return getAll().some(function (u) { return u.email === e && u.id !== excludeId; });
  }

  function create(data) {
    var users = getAll();
    var user = {
      id: genId(),
      fullName: (data.fullName || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      department: (data.department || '').trim(),
      jobTitle: (data.jobTitle || '').trim(),
      phone: (data.phone || '').trim(),
      bio: (data.bio || '').trim(),
      status: STATUSES.indexOf(data.status) !== -1 ? data.status : 'pending',
      membership: MEMBERSHIPS.indexOf(data.membership) !== -1 ? data.membership : 'free',
      createdAt: nowMs(),
      updatedAt: nowMs()
    };
    users.unshift(user);
    saveAll(users);
    return { ok: true, user: user };
  }

  function update(id, data) {
    var users = getAll();
    var user = users.find(function (u) { return u.id === id; });
    if (!user) return { ok: false, error: 'This user no longer exists.' };
    user.fullName = (data.fullName || '').trim();
    user.email = (data.email || '').trim().toLowerCase();
    user.department = (data.department || '').trim();
    user.jobTitle = (data.jobTitle || '').trim();
    user.phone = (data.phone || '').trim();
    user.bio = (data.bio || '').trim();
    if (STATUSES.indexOf(data.status) !== -1) user.status = data.status;
    if (MEMBERSHIPS.indexOf(data.membership) !== -1) user.membership = data.membership;
    user.updatedAt = nowMs();
    saveAll(users);
    return { ok: true, user: user };
  }

  function setStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) return { ok: false, error: 'Unknown status.' };
    var users = getAll();
    var user = users.find(function (u) { return u.id === id; });
    if (!user) return { ok: false, error: 'This user no longer exists.' };
    user.status = status;
    user.updatedAt = nowMs();
    saveAll(users);
    return { ok: true, user: user };
  }

  function remove(id) {
    var users = getAll();
    var next = users.filter(function (u) { return u.id !== id; });
    if (next.length === users.length) return { ok: false, error: 'This user no longer exists.' };
    saveAll(next);
    return { ok: true };
  }

  // ---------------------------------------------------------------
  // validators (mirrors the style of AxivonAuth.Validators)
  // ---------------------------------------------------------------
  var Validators = {
    fullName: function (value) {
      var v = (value || '').trim();
      if (!v) return { valid: false, message: 'Full name is required.' };
      if (v.length < 2) return { valid: false, message: 'Enter a full name.' };
      return { valid: true };
    },
    email: function (value) {
      var v = (value || '').trim();
      if (!v) return { valid: false, message: 'Email is required.' };
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!re.test(v)) return { valid: false, message: 'Enter a valid email address.' };
      return { valid: true };
    },
    department: function (value) {
      if (!(value || '').trim()) return { valid: false, message: 'Department is required.' };
      return { valid: true };
    },
    jobTitle: function (value) {
      if (!(value || '').trim()) return { valid: false, message: 'Job title is required.' };
      return { valid: true };
    },
    phone: function (value) {
      var v = (value || '').trim();
      if (!v) return { valid: true }; // optional
      var re = /^[0-9+()\-.\s]{7,20}$/;
      if (!re.test(v)) return { valid: false, message: 'Enter a valid phone number.' };
      return { valid: true };
    }
  };

  // ---------------------------------------------------------------
  // shared in-memory state (page scripts read/write this directly)
  // ---------------------------------------------------------------
  var State = {
    users: [],
    selectedUser: null,
    formData: {},
    loading: false,
    error: null,
    success: null,
    status: null,      // active filter/value in a given context
    membership: null,  // active filter/value in a given context
    searchQuery: '',
    statusFilter: 'all',
    membershipFilter: 'all'
  };

  // ---------------------------------------------------------------
  // render helpers — small "component-like" builders reused across pages
  // ---------------------------------------------------------------
  function initials(name) {
    var parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var first = parts[0][0] || '';
    var last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function statusBadge(status) {
    var label = STATUS_LABEL[status] || status;
    var cls = STATUS_BADGE_CLASS[status] || 'badge-neutral';
    return '<span class="badge ' + cls + '">' + label + '</span>';
  }

  function membershipBadge(membership) {
    var label = MEMBERSHIP_LABEL[membership] || membership;
    var cls = MEMBERSHIP_BADGE_CLASS[membership] || 'badge-neutral';
    return '<span class="badge ' + cls + '">' + label + '</span>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(ms) {
    if (!ms) return '\u2014';
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // one <tr> for the users table
  function userRow(user) {
    return (
      '<tr data-id="' + user.id + '">' +
        '<td><div class="user-cell">' +
          '<div class="avatar-sm">' + escapeHtml(initials(user.fullName)) + '</div>' +
          '<div class="who"><strong>' + escapeHtml(user.fullName) + '</strong>' +
          '<span>' + escapeHtml(user.jobTitle || '\u2014') + '</span></div>' +
        '</div></td>' +
        '<td>' + escapeHtml(user.email) + '</td>' +
        '<td>' + statusBadge(user.status) + '</td>' +
        '<td>' + membershipBadge(user.membership) + '</td>' +
        '<td><div class="row-actions">' +
          '<a class="btn btn-ghost btn-sm" href="user-details.html?id=' + encodeURIComponent(user.id) + '">View</a>' +
          '<a class="btn btn-ghost btn-sm" href="user-form.html?id=' + encodeURIComponent(user.id) + '">Edit</a>' +
        '</div></td>' +
      '</tr>'
    );
  }

  function renderTable(tbodyEl, users) {
    if (!tbodyEl) return;
    tbodyEl.innerHTML = users.map(userRow).join('');
  }

  // loading / empty / error state panel (used on list + details)
  function renderDataState(container, kind, opts) {
    if (!container) return;
    opts = opts || {};
    var iconName = kind === 'error' ? 'alert' : kind === 'empty' ? 'info' : null;
    var iconClass = kind === 'error' ? 'error' : 'info';
    var spinner = kind === 'loading' ? '<div class="spin" aria-hidden="true"></div>' : '';
    var badge = iconName ? '<div class="icon-badge ' + iconClass + '">' + (global.AxivonUI ? global.AxivonUI.icon(iconName) : '') + '</div>' : '';
    var title = opts.title || (kind === 'loading' ? 'Loading users\u2026' : kind === 'empty' ? 'No users yet' : 'Couldn\u2019t load users');
    var message = opts.message || (kind === 'loading' ? 'Hang tight while we fetch the list.' : kind === 'empty' ? 'Create your first user to get started.' : 'Something went wrong. Try again.');
    var actionHtml = opts.actionHtml || '';
    container.innerHTML =
      '<div class="data-state">' +
        spinner + badge +
        '<h3>' + escapeHtml(title) + '</h3>' +
        '<p>' + escapeHtml(message) + '</p>' +
        actionHtml +
      '</div>';
  }

  // filter + search over State.users, returns a new array
  function filteredUsers() {
    var q = (State.searchQuery || '').trim().toLowerCase();
    return State.users.filter(function (u) {
      if (State.statusFilter && State.statusFilter !== 'all' && u.status !== State.statusFilter) return false;
      if (State.membershipFilter && State.membershipFilter !== 'all' && u.membership !== State.membershipFilter) return false;
      if (!q) return true;
      return (u.fullName + ' ' + u.email + ' ' + (u.department || '') + ' ' + (u.jobTitle || '')).toLowerCase().indexOf(q) !== -1;
    });
  }

  // ---------------------------------------------------------------
  // Day 2 architecture: state, components and client-side routes
  // ---------------------------------------------------------------
  // These helpers make the User Management module behave like a small
  // frontend application even though it is intentionally backend-free.
  // Every page consumes the same store, reusable components and routes.
  var Store = {
    getState: function () { return State; },
    setUsers: function (users) { State.users = Array.isArray(users) ? users : []; return State.users; },
    selectUser: function (user) { State.selectedUser = user || null; return State.selectedUser; },
    setSearch: function (value) { State.searchQuery = value || ''; },
    setStatusFilter: function (value) { State.statusFilter = value || 'all'; },
    setMembershipFilter: function (value) { State.membershipFilter = value || 'all'; },
    setFormData: function (data) { State.formData = data || {}; return State.formData; },
    resetTransient: function () {
      State.selectedUser = null;
      State.formData = {};
      State.loading = false;
      State.error = null;
      State.success = null;
    },
    refresh: function () { return Store.setUsers(getAll()); }
  };

  var Routes = {
    home: 'index.html',
    dashboard: 'dashboard.html',
    users: 'user-management.html',
    userManagement: 'user-management.html',
    sessions: 'sessions.html',
    security: 'security.html',
    settings: 'settings.html',
    userList: function () { return 'users.html'; },
    userDetails: function (id) { return 'user-details.html?id=' + encodeURIComponent(id); },
    userCreate: function () { return 'user-form.html'; },
    userEdit: function (id) { return 'user-form.html?id=' + encodeURIComponent(id); },
    status: function (status) { return 'status.html?status=' + encodeURIComponent(status); },
    membership: function (membership) { return 'membership.html?membership=' + encodeURIComponent(membership); },
    toUserList: function () { global.location.href = Routes.userList(); },
    toUserDetails: function (id) { global.location.href = Routes.userDetails(id); },
    toUserCreate: function () { global.location.href = Routes.userCreate(); },
    toUserEdit: function (id) { global.location.href = Routes.userEdit(id); }
  };

  var Components = {
    statusBadge: statusBadge,
    membershipBadge: membershipBadge,
    userAvatar: function (user, large) {
      return '<div class="' + (large ? 'avatar-lg' : 'avatar-sm') + '">' + escapeHtml(initials(user && user.fullName)) + '</div>';
    },
    userTable: renderTable,
    dataState: renderDataState,
    userRow: userRow,
    userProfileLink: function (user, label) {
      return '<a class="btn btn-ghost btn-sm" href="' + Routes.userDetails(user.id) + '">' + escapeHtml(label || 'View profile') + '</a>';
    },
    userEditLink: function (user, label) {
      return '<a class="btn btn-ghost btn-sm" href="' + Routes.userEdit(user.id) + '">' + escapeHtml(label || 'Edit') + '</a>';
    }
  };

  global.AxivonUsers = {
    STATUSES: STATUSES,
    MEMBERSHIPS: MEMBERSHIPS,
    STATUS_LABEL: STATUS_LABEL,
    MEMBERSHIP_LABEL: MEMBERSHIP_LABEL,

    State: State,
    Store: Store,
    Routes: Routes,
    Components: Components,
    Validators: Validators,

    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    setStatus: setStatus,
    remove: remove,
    emailTaken: emailTaken,

    initials: initials,
    statusBadge: statusBadge,
    membershipBadge: membershipBadge,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    userRow: userRow,
    renderTable: renderTable,
    renderDataState: renderDataState,
    filteredUsers: filteredUsers
  };
})(window);
