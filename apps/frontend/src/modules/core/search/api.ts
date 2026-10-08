import { ApiClient, type ApiClientOptions } from '../../../lib/api-client.js';
export interface SearchQuery { q:string; types?:string[]; limit?:number; offset?:number; }
export interface SearchResult { id:string; type:string; title:string; description?:string; url?:string; score?:number; metadata?:Record<string,unknown>; }
export interface SearchResultPage { items:SearchResult[]; total:number; limit:number; offset:number; }
export class SearchApiClient extends ApiClient {
  constructor(options:ApiClientOptions={}){super(options);}
  async search(query:SearchQuery):Promise<SearchResultPage>{const p=new URLSearchParams();p.set('q',query.q);if(query.types?.length)p.set('types',query.types.join(','));if(query.limit!==undefined)p.set('limit',String(query.limit));if(query.offset!==undefined)p.set('offset',String(query.offset));return this.request<SearchResultPage>(`/api/v1/search?${p.toString()}`);}
  async types():Promise<string[]>{return this.request<string[]>('/api/v1/search/types');}
  async stats():Promise<unknown>{return this.request<unknown>('/api/v1/search/stats');}
  async index(documents:unknown[]):Promise<unknown>{return this.request<unknown>('/api/v1/search/documents',{method:'POST',body:JSON.stringify(documents)});}
  async remove(type:string,id:string):Promise<unknown>{return this.request<unknown>(`/api/v1/search/documents/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,{method:'DELETE'});}
  async reindex():Promise<unknown>{return this.request<unknown>('/api/v1/search/reindex',{method:'POST'});}
}
