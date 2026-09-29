import type { SearchQuery, SearchResponse } from './contracts';

const SEARCH_ENDPOINT = '/search';

function buildSearchUrl(input: SearchQuery): string {
  const params = new URLSearchParams();
  if (input.query.trim()) params.set('q', input.query.trim());
  if (input.page !== undefined) params.set('page', String(input.page));
  if (input.pageSize !== undefined) params.set('pageSize', String(input.pageSize));
  input.entityTypes?.forEach((type) => params.append('entityType', type));
  const query = params.toString();
  return query ? SEARCH_ENDPOINT + '?' + query : SEARCH_ENDPOINT;
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SearchResponse>;
  return Array.isArray(candidate.data) && !!candidate.meta && typeof candidate.meta.total === 'number';
}

export async function search(input: SearchQuery, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(buildSearchUrl(input), { method: 'GET', headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error('Search request failed (' + response.status + ')');
  const payload: unknown = await response.json();
  if (!isSearchResponse(payload)) throw new Error('Search response does not match the approved contract.');
  return payload;
}
