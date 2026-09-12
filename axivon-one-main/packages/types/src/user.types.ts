import { BaseEntity, UUID } from './common.types.js';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserProfile extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  organizationId: UUID;
}
