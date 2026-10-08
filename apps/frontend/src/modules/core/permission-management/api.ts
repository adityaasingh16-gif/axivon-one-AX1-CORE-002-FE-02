import { ApiClient, type ApiClientOptions } from '../../../lib/api-client.js';
export interface Permission { id:string; code:string; name?:string; description?:string; [key:string]:unknown; }
export class PermissionApiClient extends ApiClient {
  async list(query:Record<string,unknown>={}):Promise<Permission[]>{const p=new URLSearchParams();for(const [k,v] of Object.entries(query))if(v!==undefined&&v!=='')p.set(k,String(v));const s=p.toString();return this.request<Permission[]>(s?`/api/v1/permissions?${s}`:'/api/v1/permissions');}
  async groups():Promise<unknown[]>{return this.request<unknown[]>('/api/v1/permissions/groups');}
  async get(id:string):Promise<Permission>{return this.request<Permission>(`/api/v1/permissions/${encodeURIComponent(id)}`);}
}
