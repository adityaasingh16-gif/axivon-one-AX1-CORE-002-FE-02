import { BaseEntity, UUID } from './common.types.js';

export interface UserSession extends BaseEntity {
  userId: UUID;
  token: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  organizationId?: UUID;
}

export interface AuthUserSummary {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}
