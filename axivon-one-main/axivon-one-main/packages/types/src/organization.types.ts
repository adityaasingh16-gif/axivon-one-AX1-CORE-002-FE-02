import { BaseEntity } from './common.types.js';

export type OrganizationStatus = 'active' | 'inactive' | 'provisioning';

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  status: OrganizationStatus;
  logoUrl?: string;
  settings?: Record<string, unknown>;
}
