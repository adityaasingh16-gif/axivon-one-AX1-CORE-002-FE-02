import { useCallback, useEffect, useRef, useState } from 'react';
import { search } from './search-api';
import type { SearchResultItem } from './contracts';

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const execute = useCallback(async (nextQuery = query) => {
    const normalized = nextQuery.trim();
    setSubmittedQuery(normalized);
    if (!normalized) {
      controller.current?.abort(); setResults([]); setTotal(0); setError(null); setLoading(false); return;
    }
    controller.current?.abort();
    const nextController = new AbortController(); controller.current = nextController;
    const currentRequest = ++requestId.current;
    setLoading(true); setError(null);
    try {
      const response = await search({ query: normalized, page: 1, pageSize: 20 }, nextController.signal);
      if (currentRequest !== requestId.current) return;
      setResults(response.data); setTotal(response.meta.total);
    } catch (cause) {
      if (nextController.signal.aborted || currentRequest !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : 'Unable to complete search.'); setResults([]); setTotal(0);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => () => controller.current?.abort(), []);
  return { query, setQuery, submittedQuery, results, total, loading, error, execute };
}
