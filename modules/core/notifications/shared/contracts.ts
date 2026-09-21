export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "system";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResponse {
  data: Notification[];
  unreadCount: number;
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface NotificationApiError {
  status: number;
  message: string;
  code?: string;
}
