import type { ApiResponse, PaginatedResult, UserProfile, UserStatus } from '@axivon/types';
import type { ManagedUser, UserFormValues } from '../types/user-management.types.js';

export interface UserListQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: UserStatus;
}

const baseUrl = '/api/v1/users';

const request = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string; error?: { message?: string } };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // Preserve the HTTP status when the API does not return JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export class UserService {
  public static async list(query: UserListQuery = {}): Promise<PaginatedResult<ManagedUser>> {
    const params = new URLSearchParams();
    params.set('page', String(query.page ?? 1));
    params.set('limit', String(query.limit ?? 20));
    if (query.q) params.set('q', query.q);
    if (query.status) params.set('status', query.status);

    const response = await request<ApiResponse<PaginatedResult<ManagedUser>>>(`${baseUrl}?${params.toString()}`);
    return response.data;
  }

  public static async get(id: string): Promise<ManagedUser> {
    const response = await request<ApiResponse<ManagedUser>>(`${baseUrl}/${encodeURIComponent(id)}`);
    return response.data;
  }

  public static async create(values: UserFormValues): Promise<ManagedUser> {
    const response = await request<ApiResponse<ManagedUser>>(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    return response.data;
  }

  public static async update(id: string, values: UserFormValues): Promise<ManagedUser> {
    const response = await request<ApiResponse<ManagedUser>>(`${baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    return response.data;
  }

  public static async updateStatus(id: string, status: UserStatus): Promise<ManagedUser> {
    const response = await request<ApiResponse<ManagedUser>>(`${baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  public static async remove(id: string): Promise<void> {
    await request<unknown>(`${baseUrl}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

export const toUserProfile = (user: ManagedUser): UserProfile => ({
  id: user.id,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  status: user.status,
  organizationId: user.organizationId,
});
