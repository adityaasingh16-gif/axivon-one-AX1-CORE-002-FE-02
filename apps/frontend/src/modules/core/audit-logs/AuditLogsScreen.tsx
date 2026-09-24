import { FormEvent, useMemo, useState } from 'react';
import type { AuditEvent, AuditEventInput, AuditLogApi, AuditLogFilters, AuditSeverity } from '../../../../../../modules/core/audit-logs/shared/contracts';
import { useAuditLogs } from './useAuditLogs';
import './audit-logs.css';

type SeverityFilter = AuditSeverity | 'all';

export function AuditEventForm({ onCapture, disabled = false }: { onCapture: (event: AuditEventInput) => void; disabled?: boolean }) {
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [severity, setSeverity] = useState<AuditSeverity>('info');
  const [details, setDetails] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!action.trim() || !resourceType.trim() || !resourceId.trim()) return; onCapture({ action: action.trim(), resourceType: resourceType.trim(), resourceId: resourceId.trim(), severity, details: details.trim() || undefined }); setAction(''); setResourceType(''); setResourceId(''); setDetails(''); setSeverity('info'); };
  return <form className="audit-form" onSubmit={submit} aria-label="Audit event capture"><strong>Audit event capture</strong><p>Reusable event-input component for callers that have an approved write-side workflow.</p><div className="audit-form-grid"><label>Action<input value={action} onChange={(e) => setAction(e.target.value)} required disabled={disabled} /></label><label>Resource type<input value={resourceType} onChange={(e) => setResourceType(e.target.value)} required disabled={disabled} /></label><label>Resource ID<input value={resourceId} onChange={(e) => setResourceId(e.target.value)} required disabled={disabled} /></label><label>Severity<select value={severity} onChange={(e) => setSeverity(e.target.value as AuditSeverity)} disabled={disabled}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label className="audit-details">Details<textarea value={details} onChange={(e) => setDetails(e.target.value)} disabled={disabled} rows={3} /></label></div><button type="submit" disabled={disabled || !action.trim() || !resourceType.trim() || !resourceId.trim()}>Capture event</button></form>;
}

export interface AuditLogsScreenProps {
  events: AuditEvent[];
  loading?: boolean;
  error?: string | null;
  canViewLogs?: boolean;
  onRetry?: () => void;
}

export interface AuditLogsApiScreenProps {
  api: AuditLogApi;
  canViewLogs?: boolean;
}

export function AuditLogRow({ event }: { event: AuditEvent }) {
  return <article className="audit-row">
    <div className={`audit-severity audit-${event.severity}`} aria-label={`Severity ${event.severity}`}>{event.severity}</div>
    <div className="audit-event-main">
      <strong>{event.action}</strong>
      <span>{event.resourceType} · {event.resourceId}</span>
      {event.details && <p>{event.details}</p>}
    </div>
    <div className="audit-event-meta">
      <span>{event.actor} · {event.organizationId}</span>
      <span>Result: {event.result}</span>
      <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
    </div>
  </article>;
}

function AuditLogContent({ events, loading, error, onRetry }: AuditLogsScreenProps) {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [resourceType, setResourceType] = useState('all');

  const resources = useMemo(() => Array.from(new Set(events.map((event) => event.resourceType))).sort(), [events]);
  const filteredEvents = useMemo(() => events.filter((event) => {
    const text = query.trim().toLowerCase();
    const matchesText = !text || [event.action, event.resourceType, event.resourceId, event.actor, event.details ?? '']
      .some((value) => value.toLowerCase().includes(text));
    return matchesText &&
      (severity === 'all' || event.severity === severity) &&
      (resourceType === 'all' || event.resourceType === resourceType);
  }), [events, query, severity, resourceType]);

  return <section className="audit-panel" aria-labelledby="audit-list-title">
    <div className="audit-toolbar">
      <div><h2 id="audit-list-title">Activity log</h2><span>{loading ? 'Loading…' : `${filteredEvents.length} of ${events.length} loaded`}</span></div>
      <div className="audit-filters">
        <input aria-label="Search audit events" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity…" />
        <select aria-label="Filter by severity" value={severity} onChange={(e) => setSeverity(e.target.value as SeverityFilter)}>
          <option value="all">All severity</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
        </select>
        <select aria-label="Filter by resource type" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="all">All resource types</option>{resources.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </div>
    {error && <div className="audit-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry} disabled={!onRetry}>Retry</button></div>}
    {loading ? <div className="audit-empty" role="status">Loading audit events…</div>
      : filteredEvents.length === 0 ? <div className="audit-empty" role="status"><strong>No audit events found</strong><p>{query || severity !== 'all' || resourceType !== 'all' ? 'Try changing your filters.' : 'No audit records are available.'}</p></div>
      : <div className="audit-list">{filteredEvents.map((event) => <AuditLogRow key={event.id} event={event} />)}</div>}
  </section>;
}

export function AuditLogsScreen({ events, loading = false, error = null, canViewLogs = true, onRetry }: AuditLogsScreenProps) {
  if (!canViewLogs) return <main className="audit-logs"><section className="audit-access" role="alert"><h1>Audit Logs</h1><h2>Access restricted</h2><p>You do not have permission to view audit log records.</p></section></main>;

  return <main className="audit-logs">
    <header className="audit-header"><div><p className="audit-eyebrow">CORE-010</p><h1>Audit Logs</h1><p>Review auditable platform activity from the approved read-only API.</p></div><span className="audit-access-state">Access: enabled</span></header>
    <AuditLogContent events={events} loading={loading} error={error} onRetry={onRetry} />
  </main>;
}

export function AuditLogsApiScreen({ api, canViewLogs = true }: AuditLogsApiScreenProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, pageSize: 20 });
  const { data, loading, error, reload } = useAuditLogs(api, filters);

  if (!canViewLogs) return <main className="audit-logs"><section className="audit-access" role="alert"><h1>Audit Logs</h1><h2>Access restricted</h2><p>You do not have permission to view audit log records.</p></section></main>;

  return <main className="audit-logs">
    <header className="audit-header"><div><p className="audit-eyebrow">CORE-010</p><h1>Audit Logs</h1><p>Review auditable platform activity from the approved read-only API.</p></div><span className="audit-access-state">Access: enabled</span></header>
    <AuditLogContent events={data.data} loading={loading} error={error} onRetry={reload} />
    <nav className="audit-pagination" aria-label="Audit log pagination">
      <button type="button" disabled={loading || data.meta.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, data.meta.page - 1) }))}>Previous</button>
      <span>Page {data.meta.page} · {data.meta.total} total</span>
      <button type="button" disabled={loading || data.meta.page * data.meta.pageSize >= data.meta.total} onClick={() => setFilters((current) => ({ ...current, page: data.meta.page + 1 }))}>Next</button>
    </nav>
  </main>;
}
