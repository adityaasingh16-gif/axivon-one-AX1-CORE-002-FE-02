export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  href?: string;
  metadata?: Readonly<Record<string, string>>;
}

export interface NotificationPage {
  items: readonly NotificationRecord[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
  hasNextPage: boolean;
}

export interface NotificationQuery {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  categories: Readonly<Record<string, boolean>>;
}

export interface NotificationsApi {
  list(query?: NotificationQuery): Promise<NotificationPage>;
  get(id: string): Promise<NotificationRecord>;
  markRead(id: string): Promise<NotificationRecord>;
  markUnread(id: string): Promise<NotificationRecord>;
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(value: NotificationPreferences): Promise<NotificationPreferences>;
}

export type AsyncState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface NotificationsState {
  status: AsyncState;
  page: NotificationPage | null;
  selected: NotificationRecord | null;
  preferences: NotificationPreferences | null;
  errorMessage: string | null;
  actionId: string | null;
}
