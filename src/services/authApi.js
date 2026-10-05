import { apiRequest } from './apiClient';

const dataOf = (response) => response?.data ?? response;

export const authApi = {
  async login({ email, password }) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
    return dataOf(response);
  },

  async register({ name, email, password }) {
    const parts = name.trim().split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ') || '';
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: { firstName, lastName, email: email.trim(), password },
    });
    return dataOf(response);
  },

  async verifyEmail({ token }) {
    const response = await apiRequest('/auth/verify', {
      method: 'POST',
      body: { token },
    });
    return dataOf(response);
  },

  async forgotPassword(email) {
    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.trim() },
    });
    return dataOf(response);
  },

  async resetPassword({ token, newPassword }) {
    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, password: newPassword },
    });
    return dataOf(response);
  },

  async logout(token) {
    if (!token) return { revoked: false };
    const response = await apiRequest('/auth/logout', { method: 'POST', token });
    return dataOf(response);
  },

  async listSessions(token) {
    const response = await apiRequest('/auth/sessions', { token });
    return dataOf(response)?.sessions ?? [];
  },

  async revokeSession(token, sessionId) {
    const response = await apiRequest('/auth/sessions/revoke', {
      method: 'POST',
      token,
      body: { sessionId },
    });
    return dataOf(response);
  },

  async revokeAllSessions(token) {
    const response = await apiRequest('/auth/sessions/revoke-all', {
      method: 'POST',
      token,
    });
    return dataOf(response);
  },

  async refresh(refreshToken) {
    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    return dataOf(response);
  },
};
