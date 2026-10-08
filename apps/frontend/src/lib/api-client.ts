export interface ApiSuccessResponse<T> { success: true; data: T; message?: string; timestamp: string; meta?: Record<string, unknown>; }
export interface ApiFailureResponse { success: false; error: { code: string; message: string; details?: unknown; requestId?: string }; timestamp: string; }
export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiFailureResponse;
export interface ApiClientOptions { baseUrl?: string; getAccessToken?: () => string | null; getOrganizationId?: () => string | null; }

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;
  private readonly getOrganizationId?: () => string | null;
  constructor(options: ApiClientOptions = {}) { this.baseUrl=options.baseUrl??''; this.getAccessToken=options.getAccessToken; this.getOrganizationId=options.getOrganizationId; }
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers=new Headers(init.headers); headers.set('Accept','application/json');
    if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type','application/json');
    const token=this.getAccessToken?.(); if(token) headers.set('Authorization',`Bearer ${token}`);
    const organizationId=this.getOrganizationId?.(); if(organizationId) headers.set('x-organization-id',organizationId);
    const response=await fetch(`${this.baseUrl}${path}`,{...init,headers});
    if(response.status===204) return undefined as T;
    const contentType=response.headers.get('content-type')??'';
    if(!contentType.includes('application/json')) { if(!response.ok) throw new Error(`API request failed with status ${response.status}`); return (await response.text()) as T; }
    const payload=(await response.json()) as ApiEnvelope<T>;
    if(!response.ok) { if(payload.success) throw new Error(`API request failed with status ${response.status}`); throw new Error(payload.error.message); }
    if(!payload.success) throw new Error(payload.error.message);
    return payload.data;
  }
}
