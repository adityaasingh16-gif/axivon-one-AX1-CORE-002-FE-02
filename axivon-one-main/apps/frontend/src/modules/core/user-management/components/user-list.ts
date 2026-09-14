import type { UserStatus } from '@axivon/types';
import type { ManagedUser } from '../types/user-management.types.js';

export interface UserListCallbacks {
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: UserStatus | 'all') => void;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);

const statusLabel = (status: UserStatus): string => status.charAt(0).toUpperCase() + status.slice(1);

export const renderUserList = (
  container: HTMLElement,
  users: ManagedUser[],
  search: string,
  statusFilter: UserStatus | 'all',
  callbacks: UserListCallbacks,
): void => {
  const rows = users.length === 0
    ? `<div class="ax-user-empty"><div class="ax-user-empty__icon">◎</div><h3>No users found</h3><p>Try a different search or create a new user.</p><button class="ax-btn ax-btn--primary" data-action="create">Create user</button></div>`
    : `<div class="ax-user-table-wrap"><table class="ax-user-table"><thead><tr><th>User</th><th>Contact</th><th>Status</th><th>Membership</th><th></th></tr></thead><tbody>${users.map((user) => {
      const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
      const membership = user.memberships[0];
      return `<tr data-user-id="${escapeHtml(user.id)}"><td><button class="ax-user-person" data-action="open"><span class="ax-avatar">${escapeHtml(initials)}</span><span><strong>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</strong><small>${escapeHtml(user.email)}</small></span></button></td><td>${escapeHtml(user.phone ?? '—')}</td><td><span class="ax-status ax-status--${escapeHtml(user.status)}"><i></i>${statusLabel(user.status)}</span></td><td><strong>${escapeHtml(membership?.organizationName ?? 'No organization')}</strong><small>${escapeHtml(membership?.role ?? 'No role')}</small></td><td><button class="ax-icon-btn" aria-label="Open ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}" data-action="open">›</button></td></tr>`;
    }).join('')}</tbody></table></div>`;

  container.innerHTML = `<section class="ax-users-page"><div class="ax-users-toolbar"><div><p class="ax-eyebrow">CORE-002</p><h1>User management</h1><p class="ax-subtitle">Manage profiles, account status and organization membership.</p></div><button class="ax-btn ax-btn--primary" data-action="create">+ New user</button></div><div class="ax-filterbar"><label class="ax-search"><span>⌕</span><input value="${escapeHtml(search)}" placeholder="Search users by name or email" aria-label="Search users" /></label><select aria-label="Filter by status"><option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All statuses</option><option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option><option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending</option><option value="suspended" ${statusFilter === 'suspended' ? 'selected' : ''}>Suspended</option></select></div>${rows}</section>`;

  container.querySelectorAll<HTMLElement>('[data-action="create"]').forEach((button) => button.addEventListener('click', callbacks.onCreate));
  container.querySelectorAll<HTMLElement>('[data-action="open"]').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest('[data-user-id]')?.getAttribute('data-user-id');
    if (id) callbacks.onSelect(id);
  }));
  container.querySelector<HTMLInputElement>('input')?.addEventListener('input', (event) => callbacks.onSearch((event.target as HTMLInputElement).value));
  container.querySelector<HTMLSelectElement>('select')?.addEventListener('change', (event) => callbacks.onStatusFilter((event.target as HTMLSelectElement).value as UserStatus | 'all'));
};
