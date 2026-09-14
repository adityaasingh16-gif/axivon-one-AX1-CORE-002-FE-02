// services/permissionApi.js
//
// Thin API layer for the permissions module. Swap BASE_URL / endpoints to
// match your actual backend (FastAPI or Node/Express) — every function
// returns a plain JS object/array so the UI layer never touches fetch()
// directly.

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---- Permissions ------------------------------------------------------

// GET /permissions -> [{ id, key, label, module, description }]
export function fetchPermissions() {
  return request("/permissions");
}

export function createPermission(payload) {
  return request("/permissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePermission(id, payload) {
  return request(`/permissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePermission(id) {
  return request(`/permissions/${id}`, { method: "DELETE" });
}

// ---- Roles --------------------------------------------------------------

// GET /roles -> [{ id, name, description }]
export function fetchRoles() {
  return request("/roles");
}

// ---- Role <-> Permission mapping ----------------------------------------

// GET /role-permissions -> [{ roleId, permissionId, granted }]
export function fetchRolePermissionMap() {
  return request("/role-permissions");
}

// Toggle a single cell in the mapping matrix.
export function setRolePermission(roleId, permissionId, granted) {
  return request("/role-permissions", {
    method: "PUT",
    body: JSON.stringify({ roleId, permissionId, granted }),
  });
}

// Bulk save, used for "save all pending changes" flows.
export function saveRolePermissionBatch(changes) {
  // changes: [{ roleId, permissionId, granted }]
  return request("/role-permissions/batch", {
    method: "PUT",
    body: JSON.stringify({ changes }),
  });
}
