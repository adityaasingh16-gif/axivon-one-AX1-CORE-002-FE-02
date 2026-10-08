import { ApiClient } from '../../../lib/api-client.js';
export interface ReportMetadata { key:string; title:string; description:string; category:string; requiredPermission?:string; filters:readonly Record<string,unknown>[]; formats:readonly string[]; }
export interface ReportRunInput { filters:Record<string,unknown>; limit?:number; offset?:number; }
export interface ReportRunResult { report:{key:string;title:string;category:string}; filters:Record<string,unknown>; summary:Record<string,string|number|boolean|null>; rows:Record<string,string|number|boolean|null>[]; total:number; limit:number; offset:number; tookMs:number; generatedAt:string; }
export class ReportingApiClient extends ApiClient {
  async list():Promise<{reports:ReportMetadata[]}>{return this.request<{reports:ReportMetadata[]}>('/api/v1/reports');}
  async get(key:string):Promise<{report:ReportMetadata}>{return this.request<{report:ReportMetadata}>(`/api/v1/reports/${encodeURIComponent(key)}`);}
  async run(key:string,input:ReportRunInput):Promise<{result:ReportRunResult}>{return this.request<{result:ReportRunResult}>(`/api/v1/reports/${encodeURIComponent(key)}/run`,{method:'POST',body:JSON.stringify({filters:input.filters,limit:input.limit??50,offset:input.offset??0})});}
}