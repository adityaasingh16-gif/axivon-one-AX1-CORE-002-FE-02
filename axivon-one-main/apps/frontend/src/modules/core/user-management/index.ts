import type { UserStatus } from '@axivon/types';
import { renderUserDetail } from './components/user-detail.js';
import { renderUserForm } from './components/user-form.js';
import { renderUserList } from './components/user-list.js';
import { UserService } from './services/user.service.js';
import { userStore } from './state/user.store.js';
import type { ManagedUser, UserFormValues } from './types/user-management.types.js';
import './styles/user-management.css';

const sampleUsers: ManagedUser[] = [
  { id: 'user-001', createdAt: '2026-01-12T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z', firstName: 'Aarav', lastName: 'Mehta', email: 'aarav.mehta@example.com', phone: '+91 98765 43210', status: 'active', organizationId: 'org-001', memberships: [{ id: 'membership-001', organizationId: 'org-001', organizationName: 'Axivon Technologies', role: 'Administrator', status: 'active', joinedAt: '2026-01-12T10:00:00.000Z' }] },
  { id: 'user-002', createdAt: '2026-02-03T10:00:00.000Z', updatedAt: '2026-09-08T10:00:00.000Z', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 12345', status: 'active', organizationId: 'org-001', memberships: [{ id: 'membership-002', organizationId: 'org-001', organizationName: 'Axivon Technologies', role: 'Manager', status: 'active', joinedAt: '2026-02-03T10:00:00.000Z' }] },
  { id: 'user-003', createdAt: '2026-03-18T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z', firstName: 'Rohan', lastName: 'Kapoor', email: 'rohan.kapoor@example.com', status: 'pending', organizationId: 'org-001', memberships: [{ id: 'membership-003', organizationId: 'org-001', organizationName: 'Axivon Technologies', role: 'Member', status: 'invited', joinedAt: '2026-03-18T10:00:00.000Z' }] },
];

const filteredUsers = (users: ManagedUser[], search: string, status: UserStatus | 'all'): ManagedUser[] => {
  const query = search.trim().toLowerCase();
  return users.filter((user) => {
    const matchesSearch = !query || `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || user.status === status;
    return matchesSearch && matchesStatus;
  });
};

export class UserManagementApp {
  private unsubscribe: (() => void) | null = null;

  public mount(container: HTMLElement, options: { loadFromApi?: boolean } = {}): () => void {
    container.classList.add('ax-users-root');
    this.unsubscribe = userStore.subscribe((state) => this.render(container, state));
    userStore.setUsers(sampleUsers);

    if (options.loadFromApi) {
      void this.loadUsers();
    }

    return () => this.unmount();
  }

  public unmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private async loadUsers(): Promise<void> {
    userStore.setLoading(true);
    try {
      const result = await UserService.list();
      userStore.setUsers(result.items);
    } catch (error) {
      userStore.setError(error instanceof Error ? error.message : 'Unable to load users.');
    }
  }

  private render(container: HTMLElement, state: ReturnType<typeof userStore.getState>): void {
    if (state.isLoading) {
      container.innerHTML = '<div class="ax-users-page"><div class="ax-card ax-user-empty"><h3>Loading users…</h3><p>Please wait while the directory is loaded.</p></div></div>';
      return;
    }

    if (state.error) {
      container.innerHTML = `<div class="ax-users-page"><div class="ax-card ax-user-empty"><h3>Something went wrong</h3><p>${state.error}</p><button class="ax-btn ax-btn--primary" data-action="retry">Try again</button></div></div>`;
      container.querySelector('[data-action="retry"]')?.addEventListener('click', () => void this.loadUsers());
      return;
    }

    if (state.view === 'list') {
      renderUserList(container, filteredUsers(state.users, state.search, state.statusFilter), state.search, state.statusFilter, {
        onSelect: (id) => userStore.showDetail(id),
        onCreate: () => userStore.showCreate(),
        onSearch: (value) => userStore.setSearch(value),
        onStatusFilter: (value) => userStore.setStatusFilter(value),
      });
      return;
    }

    const selected = state.selectedUserId ? state.users.find((user) => user.id === state.selectedUserId) ?? null : null;
    if (state.view === 'detail' && selected) {
      renderUserDetail(container, selected, {
        onBack: () => userStore.showList(),
        onEdit: (id) => userStore.showEdit(id),
        onStatus: (id, status) => void this.updateStatus(id, status),
      });
      return;
    }

    if (state.view === 'edit' && selected) {
      renderUserForm(container, selected, {
        onCancel: () => userStore.showDetail(selected.id),
        onSubmit: (values) => this.saveUser(selected.id, values),
      });
      return;
    }

    renderUserForm(container, null, {
      onCancel: () => userStore.showList(),
      onSubmit: (values) => this.createUser(values),
    });
  }

  private async createUser(values: UserFormValues): Promise<void> {
    const now = new Date().toISOString();
    try {
      const created = await UserService.create(values);
      userStore.setUsers([created, ...userStore.getState().users]);
      userStore.showDetail(created.id);
    } catch {
      const state = userStore.getState();
      const fallback: ManagedUser = {
        id: `local-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        status: values.status,
        organizationId: 'local-organization',
        memberships: [{ id: `membership-${Date.now()}`, organizationId: 'local-organization', organizationName: values.organizationName, role: values.role, status: values.membershipStatus }],
      };
      userStore.setUsers([fallback, ...state.users]);
      userStore.showDetail(fallback.id);
    }
  }

  private async saveUser(id: string, values: UserFormValues): Promise<void> {
    try {
      const updated = await UserService.update(id, values);
      const users = userStore.getState().users.map((user) => user.id === id ? updated : user);
      userStore.setUsers(users);
      userStore.showDetail(id);
    } catch {
      const users = userStore.getState().users.map((user) => user.id === id ? {
        ...user,
        ...values,
        phone: values.phone || undefined,
        memberships: user.memberships.length > 0 ? user.memberships.map((membership, index) => index === 0 ? { ...membership, organizationName: values.organizationName, role: values.role, status: values.membershipStatus } : membership) : [{ id: `membership-${Date.now()}`, organizationId: user.organizationId, organizationName: values.organizationName, role: values.role, status: values.membershipStatus }],
        updatedAt: new Date().toISOString(),
      } : user);
      userStore.setUsers(users);
      userStore.showDetail(id);
    }
  }

  private async updateStatus(id: string, status: UserStatus): Promise<void> {
    try {
      const updated = await UserService.updateStatus(id, status);
      userStore.setUsers(userStore.getState().users.map((user) => user.id === id ? updated : user));
    } catch {
      userStore.setUsers(userStore.getState().users.map((user) => user.id === id ? { ...user, status, updatedAt: new Date().toISOString() } : user));
    }
  }
}

export * from './components/user-detail.js';
export * from './components/user-form.js';
export * from './components/user-list.js';
export * from './services/user.service.js';
export * from './state/user.store.js';
export * from './types/user-management.types.js';
