import type { AuthUserSummary } from '@axivon/types';

export interface AuthState {
  user: AuthUserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthStore {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  public getState(): AuthState {
    return { ...this.state };
  }

  public setAuth(token: string, user: AuthUserSummary): void {
    this.state = {
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    };
    this.notify();
  }

  public clearAuth(): void {
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
    this.notify();
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }
}

export const authStore = new AuthStore();
