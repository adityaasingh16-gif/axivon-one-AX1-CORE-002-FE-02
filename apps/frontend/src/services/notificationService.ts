import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
} from "../../../../modules/core/notifications/shared/contracts";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class NotificationApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "NotificationApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Notification request failed (${response.status})`;
    let code: string | undefined;
    try {
      const body = (await response.json()) as { message?: string; code?: string };
      message = body.message ?? message;
      code = body.code;
    } catch {
      // Preserve the HTTP fallback when the API does not return JSON.
    }
    throw new NotificationApiError(message, response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const notificationService = {
  list(params?: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.unreadOnly) query.set("unreadOnly", "true");
    const suffix = query.toString() ? `?${query}` : "";
    return request<NotificationListResponse>(`/api/notifications${suffix}`);
  },

  markRead(id: string) {
    return request<Notification>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    });
  },

  markAllRead() {
    return request<void>("/api/notifications/read-all", {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    });
  },

  getPreferences() {
    return request<NotificationPreferences>("/api/notifications/preferences");
  },

  updatePreferences(preferences: NotificationPreferences) {
    return request<NotificationPreferences>("/api/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });
  },
};
