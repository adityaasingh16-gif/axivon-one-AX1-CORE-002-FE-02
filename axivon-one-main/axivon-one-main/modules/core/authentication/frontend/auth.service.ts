import type { ApiResponse, AuthTokens, LoginCredentials, AuthUserSummary } from '@axivon/types';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  private static baseUrl = '/api/v1/auth';

  public static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  }

  public static async register(payload: RegisterPayload): Promise<ApiResponse<{ userId: string }>> {
    const res = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  }

  public static async fetchCurrentUser(token: string): Promise<ApiResponse<AuthUserSummary>> {
    const res = await fetch(`${this.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  }

  public static async logout(token?: string): Promise<void> {
    if (token) {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }
}
