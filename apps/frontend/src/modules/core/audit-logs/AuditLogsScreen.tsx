import { FormEvent, useMemo, useState } from 'react';
import type { AuditEvent, AuditEventInput, AuditLogApi, AuditSeverity } from '../../../../../../modules/core/audit-logs/shared/contracts';
import './audit-logs.css';

type SeverityFilter = AuditSeverity | 'all';

export interface AuditLogsScreenProps {
  events: AuditEvent[];
  api?: AuditLogApi;
  loading?: boolean;
  error?: string | null;
  canViewLogs?: boolean;
  onRetry?: () => void;
  onEventsChanged?: (events: AuditEvent[]) => void;
}

export function AuditEventForm({ onCapture, disabled = false }: { onCapture: (event: AuditEventInput) => void; disabled?: boolean }) {
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [severity, setSeverity] = useState<AuditSeverity>('info');
  const [details, setDetails] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextAction = action.trim();
    const nextResource = resource.trim();
    if (!nextAction || !nextResource) return;
    onCapture({ action: nextAction, resource: nextResource, severity, details: details.trim() || undefined });
    setAction(''); setResource(''); setDetails(''); setSeverity('info');
  };

  return <form className="audit-form" onSubmit={submit} aria-labelledby="audit-capture-title">
    <div className="audit-form-heading"><div><h2 id="audit-capture-title">Capture audit event</h2><p>Record an auditable action using the shared event contract.</p></div><span className="audit-badge">Event capture</span></div>
    <div className="audit-form-grid">
      <label>Action<input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Updated profile" required disabled={disabled} /></label>
      <label>Resource<input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. User profile" required disabled={disabled} /></label>
      <label>Severity<select value={severity} onChange={(e) => setSeverity(e.target.value as AuditSeverity)} disabled={disabled}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label>
      <label className="audit-details">Details<textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Optional event context" disabled={disabled} /></label>
    </div>
    <button type="submit" disabled={disabled || !action.trim() || !resource.trim()}>Capture event</button>
  </form>;
}

export function AuditLogRow({ event }: { event: AuditEvent }) {
  return <article className="audit-row">
    <div className={`audit-severity audit-${event.severity}`} aria-label={`Severity ${event.severity}`}>{event.severity}</div>
    <div className="audit-event-main"><strong>{event.action}</strong><span>{event.resource}</span>{event.details && <p>{event.details}</p>}</div>
    <div className="audit-event-meta"><span>{event.actor}</span><time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time></div>
  </article>;
}

export function AuditLogsScreen({ events, api, loading = false, error = null, canViewLogs = true, onRetry, onEventsChanged }: AuditLogsScreenProps) {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [resource, setResource] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resources = useMemo(() => Array.from(new Set(events.map((event) => event.resource))).sort(), [events]);
  const filteredEvents = useMemo(() => events.filter((event) => {
    const text = query.trim().toLowerCase();
    const matchesText = !text || [event.action, event.resource, event.actor, event.details ?? ''].some((value) => value.toLowerCase().includes(text));
    return matchesText && (severity === 'all' || event.severity === severity) && (resource === 'all' || event.resource === resource);
  }), [events, query, severity, resource]);

  const capture = async (input: AuditEventInput) => {
    setBusy(true); setActionError(null);
    try {
      if (!api) {
        const localEvent: AuditEvent = { ...input, id: `local-${Date.now()}`, actor: 'Current user', timestamp: new Date().toISOString() };
        onEventsChanged?.([localEvent, ...events]);
      } else {
        const created = await api.capture(input);
        onEventsChanged?.([created, ...events]);
      }
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to capture audit event.');
    } finally { setBusy(false); }
  };

  if (!canViewLogs) return <main className="audit-logs"><section className="audit-access" role="alert"><h1>Audit Logs</h1><h2>Access restricted</h2><p>You do not have permission to view audit log records.</p></section></main>;

  return <main className="audit-logs">
    <header className="audit-header"><div><p className="audit-eyebrow">CORE-010</p><h1>Audit Logs</h1><p>Capture, review and filter auditable platform activity.</p></div><span className="audit-access-state">Access: enabled</span></header>
    <AuditEventForm onCapture={(input) => void capture(input)} disabled={busy} />
    {error && <div className="audit-error" role="alert">{error}{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div>}
    {actionError && <div className="audit-error" role="alert">{actionError}</div>}
    <section className="audit-panel" aria-labelledby="audit-list-title">
      <div className="audit-toolbar"><div><h2 id="audit-list-title">Activity log</h2><span>{filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}</span></div><div className="audit-filters"><input aria-label="Search audit events" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activity…" /><select aria-label="Filter by severity" value={severity} onChange={(e) => setSeverity(e.target.value as SeverityFilter)}><option value="all">All severity</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select><select aria-label="Filter by resource" value={resource} onChange={(e) => setResource(e.target.value)}><option value="all">All resources</option>{resources.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
      {loading ? <div className="audit-empty" role="status">Loading audit events…</div> : filteredEvents.length === 0 ? <div className="audit-empty" role="status"><strong>No audit events found</strong><p>{query || severity !== 'all' || resource !== 'all' ? 'Try changing your filters.' : 'Captured events will appear here.'}</p></div> : <div className="audit-list">{filteredEvents.map((event) => <AuditLogRow key={event.id} event={event} />)}</div>}
    </section>
  </main>;
}
