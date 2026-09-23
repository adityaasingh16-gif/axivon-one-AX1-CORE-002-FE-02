export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  actor: string;
  timestamp: string;
  severity: AuditSeverity;
  details?: string;
  ipAddress?: string;
}

export interface AuditEventInput {
  action: string;
  resource: string;
  severity: AuditSeverity;
  details?: string;
}

export interface AuditLogFilters {
  query?: string;
  severity?: AuditSeverity | 'all';
  resource?: string | 'all';
  from?: string;
  to?: string;
}

export interface AuditLogApi {
  list: (filters?: AuditLogFilters) => Promise<AuditEvent[]>;
  capture: (event: AuditEventInput) => Promise<AuditEvent>;
}
