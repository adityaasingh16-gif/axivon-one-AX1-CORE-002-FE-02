export type SearchEntityType = 'user' | 'organization' | 'project' | 'file' | 'audit-log' | 'unknown';

export interface SearchQuery { query: string; page?: number; pageSize?: number; entityTypes?: SearchEntityType[]; }
export interface SearchResultItem { id: string; title: string; description?: string; entityType: SearchEntityType; href?: string; metadata?: Record<string, string>; }
export interface SearchResultMeta { page: number; pageSize: number; total: number; }
export interface SearchResponse { data: SearchResultItem[]; meta: SearchResultMeta; }
export interface SearchState { query: string; results: SearchResultItem[]; loading: boolean; error: string | null; submittedQuery: string; meta: SearchResultMeta | null; }