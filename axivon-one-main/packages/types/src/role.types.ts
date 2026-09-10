import { BaseEntity, UUID } from './common.types.js';

export interface Role extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  isSystemRole: boolean;
  organizationId?: UUID;
  permissions: UUID[];
}
