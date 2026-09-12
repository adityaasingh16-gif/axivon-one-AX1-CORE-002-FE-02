import { BaseEntity, UUID } from './common.types.js';

export interface AuditLogEntry extends BaseEntity {
  action: string;
  module: string;
  userId?: UUID;
  organizationId?: UUID;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
}
