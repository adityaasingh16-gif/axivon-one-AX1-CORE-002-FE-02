import type { UserStatus } from '@axivon/types';
import type { ManagedUser, UserManagementState } from '../types/user-management.types.js';

const initialState: UserManagementState = {
  users: [],
  selectedUserId: null,
  search: '',
  statusFilter: 'all',
  view: 'list',
  isLoading: false,
  error: null,
};

class UserStore {
  private state: UserManagementState = { ...initialState, users: [] };
  private listeners: Array<(state: UserManagementState) => void> = [];

  public getState(): UserManagementState {
    return {
      ...this.state,
      users: [...this.state.users],
    };
  }

  public setUsers(users: ManagedUser[]): void {
    this.state = { ...this.state, users, isLoading: false, error: null };
    this.notify();
  }

  public setLoading(isLoading: boolean): void {
    this.state = { ...this.state, isLoading };
    this.notify();
  }

  public setError(error: string | null): void {
    this.state = { ...this.state, error, isLoading: false };
    this.notify();
  }

  public setSearch(search: string): void {
    this.state = { ...this.state, search };
    this.notify();
  }

  public setStatusFilter(statusFilter: UserStatus | 'all'): void {
    this.state = { ...this.state, statusFilter };
    this.notify();
  }

  public showList(): void {
    this.state = { ...this.state, view: 'list', selectedUserId: null };
    this.notify();
  }

  public showCreate(): void {
    this.state = { ...this.state, view: 'create', selectedUserId: null, error: null };
    this.notify();
  }

  public showDetail(userId: string): void {
    this.state = { ...this.state, view: 'detail', selectedUserId: userId, error: null };
    this.notify();
  }

  public showEdit(userId: string): void {
    this.state = { ...this.state, view: 'edit', selectedUserId: userId, error: null };
    this.notify();
  }

  public subscribe(listener: (state: UserManagementState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const userStore = new UserStore();
