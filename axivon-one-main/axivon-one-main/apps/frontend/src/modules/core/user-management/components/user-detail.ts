import type { UserStatus } from '@axivon/types';
import type { ManagedUser } from '../types/user-management.types.js';

export interface UserDetailCallbacks {
  onBack: () => void;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: UserStatus) => void;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
const label = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const renderUserDetail = (container: HTMLElement, user: ManagedUser, callbacks: UserDetailCallbacks): void => {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  container.innerHTML = `<section class="ax-users-page"><button class="ax-back" data-action="back">← Back to users</button><div class="ax-detail-header"><div class="ax-profile-heading"><span class="ax-avatar ax-avatar--xl">${escapeHtml(initials)}</span><div><p class="ax-eyebrow">USER PROFILE</p><h1>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</h1><p class="ax-subtitle">${escapeHtml(user.email)}</p></div></div><div class="ax-detail-actions"><button class="ax-btn ax-btn--secondary" data-action="edit">Edit profile</button><select aria-label="Change user status" data-action="status"><option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option><option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option><option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option></select></div></div><div class="ax-detail-grid"><article class="ax-card"><div class="ax-card__heading"><h2>Profile information</h2><span class="ax-status ax-status--${escapeHtml(user.status)}"><i></i>${label(user.status)}</span></div><dl class="ax-info-grid"><div><dt>First name</dt><dd>${escapeHtml(user.firstName)}</dd></div><div><dt>Last name</dt><dd>${escapeHtml(user.lastName)}</dd></div><div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div><div><dt>Phone</dt><dd>${escapeHtml(user.phone ?? 'Not provided')}</dd></div></dl></article><article class="ax-card"><div class="ax-card__heading"><h2>Memberships</h2><span class="ax-count">${user.memberships.length}</span></div>${user.memberships.length === 0 ? '<p class="ax-muted">No organization memberships.</p>' : `<div class="ax-memberships">${user.memberships.map((membership) => `<div class="ax-membership"><span class="ax-membership__mark">${escapeHtml(membership.organizationName[0] ?? 'O')}</span><div><strong>${escapeHtml(membership.organizationName)}</strong><small>${escapeHtml(membership.role)} · ${label(membership.status)}</small></div><span class="ax-status ax-status--${escapeHtml(membership.status === 'invited' ? 'pending' : membership.status)}"><i></i>${label(membership.status)}</span></div>`).join('')}</div>`}</article></div></section>`;

  container.querySelector('[data-action="back"]')?.addEventListener('click', callbacks.onBack);
  container.querySelector('[data-action="edit"]')?.addEventListener('click', () => callbacks.onEdit(user.id));
  container.querySelector<HTMLSelectElement>('[data-action="status"]')?.addEventListener('change', (event) => callbacks.onStatus(user.id, (event.target as HTMLSelectElement).value as UserStatus));
};
