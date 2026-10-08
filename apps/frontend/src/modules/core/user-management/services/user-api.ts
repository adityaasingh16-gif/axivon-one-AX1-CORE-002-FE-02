import { ApiClient, type ApiClientOptions } from '../../../../lib/api-client.js';
export interface UserProfile { id:string; email:string; firstName:string; lastName:string; phone?:string; avatarUrl?:string; status:string; organizationId:string; [key:string]:unknown; }
export interface UserListResult { items:UserProfile[]; total:number; page:number; pageSize:number; totalPages:number; }
export interface UserListQuery { page?:number; pageSize?:number; status?:string; search?:string; }
export class UserApiClient extends ApiClient {
  async list(query:UserListQuery={}):Promise<UserListResult>{const p=new URLSearchParams();for(const [k,v] of Object.entries(query))if(v!==undefined&&v!=='')p.set(k,String(v));return this.request<UserListResult>(`/api/v1/users?${p.toString()}`);}
  async get(id:string):Promise<UserProfile>{return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(id)}`);}
  async create(input:Record<string,unknown>):Promise<UserProfile>{return this.request<UserProfile>('/api/v1/users',{method:'POST',body:JSON.stringify(input)});}
  async update(id:string,input:Record<string,unknown>):Promise<UserProfile>{return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(input)});}
  async updateProfile(id:string,input:Record<string,unknown>):Promise<UserProfile>{return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(id)}/profile`,{method:'PATCH',body:JSON.stringify(input)});}
  async updateStatus(id:string,input:Record<string,unknown>):Promise<UserProfile>{return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify(input)});}
  async memberships(id:string):Promise<unknown[]>{return this.request<unknown[]>(`/api/v1/users/${encodeURIComponent(id)}/memberships`);}
  async addMembership(id:string,input:Record<string,unknown>):Promise<unknown>{return this.request<unknown>(`/api/v1/users/${encodeURIComponent(id)}/memberships`,{method:'POST',body:JSON.stringify(input)});}
  async removeMembership(id:string,organizationId:string):Promise<{removed:boolean}>{return this.request<{removed:boolean}>(`/api/v1/users/${encodeURIComponent(id)}/memberships/${encodeURIComponent(organizationId)}`,{method:'DELETE'});}
}
