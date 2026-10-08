import type { SearchQuery, SearchResponse } from './contracts';

const SEARCH_ENDPOINT = '/api/v1/search';

interface SearchApiEnvelope {
  success: true;
  data: {
    query: { q: string; types: string[]; limit: number; offset: number };
    total: number;
    tookMs: number;
    hits: Array<{
      documentType: string;
      documentId: string;
      organizationId: string | null;
      title: string;
      snippet?: string;
      url?: string;
      score?: number;
      metadata?: Record<string, unknown>;
      indexedAt: string;
    }>;
  };
  message?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export async function search(input: SearchQuery, signal?: AbortSignal): Promise<SearchResponse> {
  const params = new URLSearchParams();
  if (input.query.trim()) params.set('q', input.query.trim());
  if (input.page !== undefined) params.set('offset', String(Math.max(0, (input.page - 1) * (input.pageSize ?? 20))));
  if (input.pageSize !== undefined) params.set('limit', String(input.pageSize));
  input.entityTypes?.forEach((type) => params.append('types', type));

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) throw new Error('Search request failed (' + response.status + ')');

  const payload = (await response.json()) as SearchApiEnvelope;
  if (!payload.success || !payload.data || !Array.isArray(payload.data.hits)) {
    throw new Error('Search response does not match the approved API contract.');
  }

  return {
    data: payload.data.hits.map((hit) => ({
      id: hit.documentId,
      entityType: hit.documentType,
      title: hit.title,
      snippet: hit.snippet,
      url: hit.url,
      score: hit.score,
      metadata: hit.metadata,
    })),
    meta: {
      total: payload.data.total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? payload.data.query.limit,
      totalPages: Math.ceil(payload.data.total / (input.pageSize ?? payload.data.query.limit)),
    },
  };
}
