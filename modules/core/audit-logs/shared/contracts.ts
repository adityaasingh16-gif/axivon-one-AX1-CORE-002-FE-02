export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AuditResult = 'success' | 'failure';
export interface AuditEventInput { action: string; resourceType: string; resourceId: string; severity: AuditSeverity; details?: string; }

export interface AuditEvent {
  id: string;
  actor: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  result: AuditResult;
  severity: AuditSeverity;
  details?: string;
  ipAddress?: string;
}

export interface AuditLogFilters {
  query?: string;
  severity?: AuditSeverity | 'all';
  resourceType?: string | 'all';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogMeta {
  page: number;
  pageSize: number;
  total: number;
  requestId?: string;
}

export interface AuditLogListResponse {
  data: AuditEvent[];
  meta: AuditLogMeta;
}

export interface AuditLogError {
  code: string;
  message: string;
  details: Array<{ field?: string; issue?: string }>;
  requestId?: string;
}

export interface AuditLogApi {
  list: (filters?: AuditLogFilters) => Promise<AuditLogListResponse>;
}
