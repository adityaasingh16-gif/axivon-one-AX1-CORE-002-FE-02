import { ApiClient, type ApiClientOptions } from '../../../lib/api-client.js';
export interface RoleProfile { id:string; name:string; description?:string; permissions?:string[]; [key:string]:unknown; }
export interface RoleListResult { items:RoleProfile[]; total:number; page:number; pageSize:number; totalPages:number; }
export class RoleApiClient extends ApiClient {
  async list(query:Record<string,unknown>={}):Promise<RoleListResult>{const p=new URLSearchParams();for(const [k,v] of Object.entries(query))if(v!==undefined&&v!=='')p.set(k,String(v));const s=p.toString();return this.request<RoleListResult>(s?`/api/v1/roles?${s}`:'/api/v1/roles');}
  async get(id:string):Promise<RoleProfile>{return this.request<RoleProfile>(`/api/v1/roles/${encodeURIComponent(id)}`);}
  async create(input:Record<string,unknown>):Promise<RoleProfile>{return this.request<RoleProfile>('/api/v1/roles',{method:'POST',body:JSON.stringify(input)});}
  async update(id:string,input:Record<string,unknown>):Promise<RoleProfile>{return this.request<RoleProfile>(`/api/v1/roles/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(input)});}
  async assignments(id:string):Promise<unknown[]>{return this.request<unknown[]>(`/api/v1/roles/${encodeURIComponent(id)}/assignments`);}
  async assign(id:string,input:Record<string,unknown>):Promise<unknown>{return this.request<unknown>(`/api/v1/roles/${encodeURIComponent(id)}/assignments`,{method:'POST',body:JSON.stringify(input)});}
  async unassign(id:string,userId:string):Promise<{removed:boolean}>{return this.request<{removed:boolean}>(`/api/v1/roles/${encodeURIComponent(id)}/assignments/${encodeURIComponent(userId)}`,{method:'DELETE'});}
}
