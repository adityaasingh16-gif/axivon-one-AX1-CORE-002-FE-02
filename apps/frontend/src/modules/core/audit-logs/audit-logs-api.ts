import type { AuditLogApi, AuditLogError, AuditLogFilters, AuditLogListResponse } from '../../../../../../modules/core/audit-logs/shared/contracts';

export interface AuditLogApiOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  getAuthHeaders?: () => HeadersInit;
}

function buildQuery(filters: AuditLogFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set('q', filters.query.trim());
  if (filters.severity && filters.severity !== 'all') params.set('severity', filters.severity);
  if (filters.resourceType && filters.resourceType !== 'all') params.set('resourceType', filters.resourceType);
  if (filters.from) params.set('createdAfter', filters.from);
  if (filters.to) params.set('createdBefore', filters.to);
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 20));
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function readError(response: Response): Promise<AuditLogError> {
  try {
    const body = (await response.json()) as { error?: AuditLogError };
    if (body.error?.message) return body.error;
  } catch {
    // Use the safe generic error below.
  }
  return { code: 'REQUEST_FAILED', message: 'Unable to load audit logs.', details: [] };
}

export function createAuditLogApi(options: AuditLogApiOptions = {}): AuditLogApi {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  return {
    async list(filters = {}) {
      const response = await fetchImpl(`${baseUrl}/audit-logs${buildQuery(filters)}`, {
        method: 'GET',
        headers: { Accept: 'application/json', ...(options.getAuthHeaders?.() ?? {}) },
      });
      if (!response.ok) {
        const error = await readError(response);
        throw new Error(`${error.message} [${error.code}]${error.requestId ? ` Request ID: ${error.requestId}` : ''}`);
      }
      const body = (await response.json()) as AuditLogListResponse;
      if (!Array.isArray(body.data) || !body.meta) throw new Error('The audit log response did not match the approved API contract.');
      return body;
    },
  };
}
