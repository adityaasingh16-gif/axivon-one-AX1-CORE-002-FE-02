import type { UUID, AuthTokens, LoginCredentials } from '@axivon/types';

export interface UserRecord {
  id: UUID;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: string;
}

export class AuthenticationBackendService {
  public static async authenticate(credentials: LoginCredentials): Promise<AuthTokens> {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password required');
    }
    return {
      accessToken: 'sample_jwt_access_token',
      refreshToken: 'sample_jwt_refresh_token',
      expiresIn: 3600,
    };
  }

  public static async verifySessionToken(token: string): Promise<{ userId: UUID; email: string }> {
    if (!token) {
      throw new Error('Token required');
    }
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'admin@axivon.com',
    };
  }
}
