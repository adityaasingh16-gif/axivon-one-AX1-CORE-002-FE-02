import type { SearchEntityType, SearchQuery, SearchResponse } from './contracts';
const SEARCH_ENDPOINT='/api/v1/search';
interface SearchApiEnvelope { success:true; data:{query:{q:string;types:string[];limit:number;offset:number};total:number;hits:Array<{documentType:string;documentId:string;title:string;snippet?:string;url?:string;metadata?:Record<string,unknown>}>}; timestamp:string; }
const isEntityType=(v:string):v is SearchEntityType=>v==='user'||v==='organization'||v==='project'||v==='file'||v==='audit-log'||v==='unknown';
export async function search(input:SearchQuery,signal?:AbortSignal):Promise<SearchResponse>{
 const p=new URLSearchParams(); if(input.query.trim())p.set('q',input.query.trim()); if(input.page!==undefined)p.set('offset',String(Math.max(0,(input.page-1)*(input.pageSize??20)))); if(input.pageSize!==undefined)p.set('limit',String(input.pageSize)); input.entityTypes?.forEach(t=>p.append('types',t));
 const response=await fetch(`${SEARCH_ENDPOINT}?${p.toString()}`,{method:'GET',headers:{Accept:'application/json'},signal}); if(!response.ok)throw new Error('Search request failed ('+response.status+')');
 const payload=(await response.json()) as SearchApiEnvelope; if(!payload.success||!payload.data||!Array.isArray(payload.data.hits))throw new Error('Search response does not match the approved API contract.');
 const pageSize=input.pageSize??payload.data.query.limit;
 return {data:payload.data.hits.map(h=>({id:h.documentId,title:h.title,description:h.snippet,entityType:isEntityType(h.documentType)?h.documentType:'unknown',href:h.url,metadata:Object.fromEntries(Object.entries(h.metadata??{}).map(([k,v])=>[k,String(v)]))})),meta:{total:payload.data.total,page:input.page??1,pageSize}};
}