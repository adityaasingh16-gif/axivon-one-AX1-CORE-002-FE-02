import { authStore } from '../../../../../../../modules/core/authentication/frontend/index.js';

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export interface Employee {
  id:string; employeeCode:string; firstName:string; lastName:string; email:string; phone:string|null;
  department:string; jobTitle:string; managerId:string|null; employmentType:EmploymentType;
  status:EmployeeStatus; startDate:string; createdAt:string; updatedAt:string; organizationId:string|null;
}
export interface EmployeeDraft {
  employeeCode:string; firstName:string; lastName:string; email:string; phone?:string;
  department:string; jobTitle:string; managerId?:string; employmentType:EmploymentType; status?:EmployeeStatus; startDate:string;
}
export interface EmployeePage { items:Employee[]; total:number; page:number; pageSize:number; totalPages:number; }
export interface EmployeeQuery { search?:string; status?:EmployeeStatus|'all'; department?:string|'all'; page?:number; pageSize?:number; }

const baseUrl = (globalThis as typeof globalThis & { __AXIVON_API_BASE_URL__?:string }).__AXIVON_API_BASE_URL__ ?? '';
async function request<T>(path:string, init:RequestInit = {}):Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  const token = authStore.getState().token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(baseUrl + path, { ...init, headers, credentials:'include' });
  const payload = await response.json().catch(() => null) as { success?:boolean; data?:T; error?:{message?:string} } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.error?.message ?? `Employee request failed (${response.status})`);
  return payload.data as T;
}
export const employeeApi = {
  list(query:EmployeeQuery = {}):Promise<EmployeePage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
    return request<EmployeePage>(`/api/v1/employees?${params.toString()}`);
  },
  create(draft:EmployeeDraft):Promise<Employee> { return request<Employee>('/api/v1/employees', { method:'POST', body:JSON.stringify(draft) }); },
  update(id:string, draft:EmployeeDraft):Promise<Employee> { return request<Employee>(`/api/v1/employees/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(draft) }); },
  remove(id:string):Promise<{deleted:boolean}> { return request<{deleted:boolean}>(`/api/v1/employees/${encodeURIComponent(id)}`, { method:'DELETE' }); },
  updateStatus(id:string, status:EmployeeStatus):Promise<Employee> { return request<Employee>(`/api/v1/employees/${encodeURIComponent(id)}/status`, { method:'PATCH', body:JSON.stringify({ status }) }); },
};
