// services/mockData.js
//
// Local fixtures for local dev / Storybook-less preview. Not imported by
// permissionApi.js — wire this into a mock server (e.g. msw) or use it
// directly in the pages during development if the backend isn't ready yet.

export const mockPermissions = [
  { id: "p1", key: "users:read", label: "View users", module: "Users", description: "View user profiles and account details." },
  { id: "p2", key: "users:write", label: "Edit users", module: "Users", description: "Create, update, or deactivate user accounts." },
  { id: "p3", key: "billing:read", label: "View billing", module: "Billing", description: "View invoices, plans, and payment history." },
  { id: "p4", key: "billing:write", label: "Manage billing", module: "Billing", description: "Change plans, update payment methods, issue refunds." },
  { id: "p5", key: "reports:read", label: "View reports", module: "Reports", description: "Access dashboards and exported reports." },
  { id: "p6", key: "reports:export", label: "Export reports", module: "Reports", description: "Download report data as CSV/PDF." },
  { id: "p7", key: "settings:write", label: "Manage settings", module: "Settings", description: "Change org-wide configuration." },
  { id: "p8", key: "audit:read", label: "View audit log", module: "Settings", description: "Read the org's security and access audit trail." },
];

export const mockRoles = [
  { id: "r1", name: "Admin", description: "Full access across the organization." },
  { id: "r2", name: "Manager", description: "Operational access without billing or settings." },
  { id: "r3", name: "Support", description: "Read-mostly access for support tickets." },
  { id: "r4", name: "Viewer", description: "Read-only access." },
];

export const mockRolePermissionMap = [
  { roleId: "r1", permissionId: "p1", granted: true },
  { roleId: "r1", permissionId: "p2", granted: true },
  { roleId: "r1", permissionId: "p3", granted: true },
  { roleId: "r1", permissionId: "p4", granted: true },
  { roleId: "r1", permissionId: "p5", granted: true },
  { roleId: "r1", permissionId: "p6", granted: true },
  { roleId: "r1", permissionId: "p7", granted: true },
  { roleId: "r1", permissionId: "p8", granted: true },
  { roleId: "r2", permissionId: "p1", granted: true },
  { roleId: "r2", permissionId: "p2", granted: true },
  { roleId: "r2", permissionId: "p5", granted: true },
  { roleId: "r2", permissionId: "p6", granted: true },
  { roleId: "r3", permissionId: "p1", granted: true },
  { roleId: "r3", permissionId: "p5", granted: true },
  { roleId: "r4", permissionId: "p1", granted: true },
  { roleId: "r4", permissionId: "p5", granted: true },
];
