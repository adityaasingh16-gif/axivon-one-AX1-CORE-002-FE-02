const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class NotificationApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'NotificationApiError';
    this.status = status;
    this.details = details;
  }
}

const unwrap = (payload) => payload?.data ?? payload;

const request = async (path, { token, method = 'GET', body, organizationId, signal } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new NotificationApiError(
      payload?.message || payload?.error?.message || `Notification request failed (${response.status}).`,
      response.status,
      payload,
    );
  }

  return payload;
};

export const notificationApi = {
  async list({ token, organizationId, page = 1, pageSize = 20, isRead, type, priority, search, signal } = {}) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sortBy: 'createdAt', sortOrder: 'desc' });
    if (isRead !== undefined) query.set('isRead', String(isRead));
    if (type) query.set('type', type);
    if (priority) query.set('priority', priority);
    if (search?.trim()) query.set('search', search.trim());
    const payload = await request(`/api/v1/notifications?${query.toString()}`, { token, organizationId, signal });
    return { items: unwrap(payload) || [], meta: payload?.meta || {} };
  },

  async unreadCount({ token, organizationId, signal } = {}) {
    const payload = await request('/api/v1/notifications/unread-count', { token, organizationId, signal });
    return unwrap(payload);
  },

  async markRead(notificationId, isRead, { token, organizationId } = {}) {
    const payload = await request(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
      token, organizationId, method: 'PATCH', body: { isRead },
    });
    return unwrap(payload);
  },

  async markAllRead({ token, organizationId } = {}) {
    const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    const payload = await request(`/api/v1/notifications/read-all${query}`, {
      token, organizationId, method: 'POST', body: {},
    });
    return unwrap(payload);
  },

  async remove(notificationId, { token, organizationId } = {}) {
    const payload = await request(`/api/v1/notifications/${encodeURIComponent(notificationId)}`, {
      token, organizationId, method: 'DELETE',
    });
    return unwrap(payload);
  },

  async listPreferences({ token, organizationId, signal } = {}) {
    const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    const payload = await request(`/api/v1/notifications/preferences${query}`, { token, organizationId, signal });
    return unwrap(payload) || [];
  },

  async savePreference(input, { token, organizationId } = {}) {
    const payload = await request('/api/v1/notifications/preferences', {
      token, organizationId, method: 'PUT', body: input,
    });
    return unwrap(payload);
  },

  async listDelivery(notificationId, { token, organizationId, signal } = {}) {
    const payload = await request(`/api/v1/notifications/${encodeURIComponent(notificationId)}/delivery`, {
      token, organizationId, signal,
    });
    return unwrap(payload) || [];
  },
};
