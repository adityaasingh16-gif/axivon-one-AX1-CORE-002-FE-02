import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuditLogApi, AuditLogFilters, AuditLogListResponse } from '../../../../../../modules/core/audit-logs/shared/contracts';

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_RESPONSE: AuditLogListResponse = { data: [], meta: { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 } };

export function useAuditLogs(api: AuditLogApi, filters: AuditLogFilters) {
  const [data, setData] = useState<AuditLogListResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.list({ ...filters, page: filters.page ?? 1, pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE });
      if (requestId !== requestRef.current) return;
      setData(response);
    } catch (cause) {
      if (requestId !== requestRef.current) return;
      setError(cause instanceof Error ? cause.message : 'Unable to load audit logs.');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
