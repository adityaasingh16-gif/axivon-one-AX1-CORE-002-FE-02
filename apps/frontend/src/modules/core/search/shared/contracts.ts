export type SearchScope = 'all' | 'users' | 'organizations' | 'files' | 'audit-logs';

export interface SearchQuery { query: string; scope?: SearchScope; page?: number; pageSize?: number; }
export interface SearchResult { id: string; title: string; type: string; description?: string; href?: string; score?: number; }
export interface SearchResultMeta { page: number; pageSize: number; total: number; hasNext: boolean; }
export interface SearchResponse { data: SearchResult[]; meta: SearchResultMeta; }
export interface SearchApi { search(request: SearchQuery): Promise<SearchResponse>; }
