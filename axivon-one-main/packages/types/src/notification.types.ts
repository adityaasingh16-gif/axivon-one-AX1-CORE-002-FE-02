import { BaseEntity, UUID } from './common.types.js';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface NotificationItem extends BaseEntity {
  userId: UUID;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
}
