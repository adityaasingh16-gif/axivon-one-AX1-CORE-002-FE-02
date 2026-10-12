import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, LayoutGrid, List, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { taskApi } from '../services/taskApi';
import { getTaskPermissions, TASK_PRIORITIES, TASK_STATUSES, validateTaskDraft } from '../utils/taskValidation';
import '../styles/task-management.css';

const BLANK_DRAFT = { title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '', dueDate: '', projectId: '', leadId: '', customerId: '' };
const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done', cancelled: 'Cancelled' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const toDateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export function TaskManagementView() {
  const { user, token, showToast } = useAuth();
  const { activeOrg } = useOrg();
  const location = useLocation();
  const permissions = useMemo(() => getTaskPermissions(user), [user]);
  const organizationId = activeOrg?.id || '';
  const isBoard = location.pathname === '/tasks/board';
  const isSettings = location.pathname === '/tasks/settings';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(BLANK_DRAFT);
  const [editingId, setEditingId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!permissions.canRead) {
        setLoading(false);
        setError('You do not have permission to view tasks.');
        return;
      }
      if (!token) {
        setLoading(false);
        setError('Your session is missing. Please sign in again.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await taskApi.list({
          token,
          organizationId,
          signal: controller.signal,
          query: { search, status, priority, page, pageSize: 10 },
        });
        if (controller.signal.aborted) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(result.page);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load tasks.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [token, organizationId, permissions.canRead, search, status, priority, page, refreshKey]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / 10)), [total]);
  const counts = useMemo(() => ({
    active: items.filter((task) => task.status === 'todo' || task.status === 'in_progress').length,
    blocked: items.filter((task) => task.status === 'blocked').length,
    complete: items.filter((task) => task.status === 'done').length,
  }), [items]);

  const resetForm = () => {
    setDraft(BLANK_DRAFT);
    setEditingId('');
    setFieldErrors({});
    setFormOpen(false);
  };
  const startCreate = () => {
    if (!permissions.canCreate) return;
    setDraft(BLANK_DRAFT);
    setEditingId('');
    setFieldErrors({});
    setFormOpen(true);
    setNotice('');
  };
  const startEdit = (task) => {
    if (!permissions.canUpdate) return;
    setDraft({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
      projectId: task.projectId || '',
      leadId: task.leadId || '',
      customerId: task.customerId || '',
    });
    setEditingId(task.id);
    setFieldErrors({});
    setFormOpen(true);
    setNotice('');
  };
  const changeDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };
  const saveTask = async (event) => {
    event.preventDefault();
    if (editingId ? !permissions.canUpdate : !permissions.canCreate) return;
    const validation = validateTaskDraft(draft);
    setFieldErrors(validation);
    if (Object.keys(validation).length) return;
    setSaving(true);
    setError('');
    setNotice('');
    const context = { token, organizationId };
    const payload = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      assigneeId: draft.assigneeId.trim(),
      dueDate: draft.dueDate || null,
      projectId: draft.projectId.trim() || null,
      leadId: draft.leadId.trim() || null,
      customerId: draft.customerId.trim() || null,
    };
    try {
      if (editingId) await taskApi.update(editingId, payload, context);
      else await taskApi.create(payload, context);
      resetForm();
      setNotice(editingId ? 'Task updated successfully.' : 'Task created successfully.');
      if (showToast) showToast(editingId ? 'Task updated successfully.' : 'Task created successfully.', 'success');
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  };
  const deleteTask = async (task) => {
    if (!permissions.canDelete || busyId) return;
    if (!window.confirm('Delete "' + task.title + '"? This action cannot be undone.')) return;
    setBusyId(task.id);
    setError('');
    setNotice('');
    try {
      await taskApi.remove(task.id, { token, organizationId });
      setNotice('Task deleted.');
      if (showToast) showToast('Task deleted.', 'success');
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete task.');
    } finally {
      setBusyId('');
    }
  };
  const changeStatus = async (task, nextStatus) => {
    if (!permissions.canUpdate || busyId) return;
    setBusyId(task.id);
    setError('');
    try {
      await taskApi.update(task.id, { status: nextStatus }, { token, organizationId });
      setNotice('Task status updated.');
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update task status.');
    } finally {
      setBusyId('');
    }
  };
  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  if (!permissions.canRead) {
    return <main className="task-management" aria-labelledby="task-page-title"><section className="task-state task-state--error" role="alert"><AlertCircle aria-hidden="true" /><h1 id="task-page-title">Access denied</h1><p>Your account cannot view task management.</p></section></main>;
  }

  return (
    <main className="task-management" aria-labelledby="task-page-title">
      <header className="task-header">
        <div className="task-header__title">
          <div className="task-header__icon"><ClipboardList aria-hidden="true" /></div>
          <div><p className="task-eyebrow">AXIVON ONE · BUS-005</p><h1 id="task-page-title">{isBoard ? 'Task Board' : isSettings ? 'Task Settings' : 'Task Management'}</h1><p>Plan, assign, and track operational work in one place.</p></div>
        </div>
        {!isSettings && permissions.canCreate && <button className="task-button task-button--primary" type="button" onClick={startCreate}><Plus aria-hidden="true" size={16} /> New task</button>}
      </header>

      <nav className="task-tabs" aria-label="Task Management navigation">
        <Link to="/tasks" aria-current={location.pathname === '/tasks' ? 'page' : undefined} className={location.pathname === '/tasks' ? 'is-active' : ''}><List aria-hidden="true" size={16} /> All tasks</Link>
        <Link to="/tasks/board" aria-current={isBoard ? 'page' : undefined} className={isBoard ? 'is-active' : ''}><LayoutGrid aria-hidden="true" size={16} /> Board</Link>
        <Link to="/tasks/settings" aria-current={isSettings ? 'page' : undefined} className={isSettings ? 'is-active' : ''}>Settings</Link>
      </nav>

      {error && <div className="task-alert task-alert--error" role="alert"><AlertCircle aria-hidden="true" /><span>{error}</span><button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Retry</button></div>}
      {notice && <div className="task-alert task-alert--success" role="status"><CheckCircle2 aria-hidden="true" /><span>{notice}</span></div>}

      {isSettings ? (
        <section className="task-panel"><h2>Task settings</h2><p>Access to task actions follows your account role and the backend's organization-level authorization. The backend remains the source of truth for permissions.</p><p className="task-muted">No module settings are changed from this page.</p></section>
      ) : (
        <>
          {!isBoard && <section className="task-summary" aria-label="Task summary">
            <article><span>Total matching tasks</span><strong>{total}</strong></article>
            <article><span>Active on this page</span><strong>{counts.active}</strong></article>
            <article><span>Blocked on this page</span><strong>{counts.blocked}</strong></article>
            <article><span>Completed on this page</span><strong>{counts.complete}</strong></article>
          </section>}
          <form className="task-filters" onSubmit={applySearch} aria-label="Task filters">
            <label className="task-search"><span>Search tasks</span><div><Search aria-hidden="true" size={16} /><input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Task title or keyword" /></div></label>
            <label><span>Status</span><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="all">All statuses</option>{TASK_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label>
            <label><span>Priority</span><select value={priority} onChange={(event) => { setPage(1); setPriority(event.target.value); }}><option value="all">All priorities</option>{TASK_PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_LABELS[value]}</option>)}</select></label>
            <button className="task-button task-button--primary" type="submit"><Search aria-hidden="true" size={15} /> Apply</button>
            <button className="task-button" type="button" onClick={() => { setSearchInput(''); setSearch(''); setStatus('all'); setPriority('all'); setPage(1); }}><X aria-hidden="true" size={15} /> Clear</button>
          </form>

          {formOpen && <section className="task-panel task-form-panel" aria-labelledby="task-form-title">
            <header><div><h2 id="task-form-title">{editingId ? 'Edit task' : 'Create task'}</h2><p>Fields marked * are required.</p></div><button className="task-icon-button" type="button" aria-label="Close task form" onClick={resetForm}><X aria-hidden="true" /></button></header>
            <form onSubmit={saveTask} noValidate>
              <div className="task-form-grid">
                <label className="task-field task-field--wide"><span>Task title *</span><input maxLength={160} required value={draft.title} onChange={(event) => changeDraft('title', event.target.value)} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'task-title-error' : undefined} />{fieldErrors.title && <small id="task-title-error" role="alert">{fieldErrors.title}</small>}</label>
                <label className="task-field task-field--wide"><span>Description</span><textarea maxLength={4000} rows={3} value={draft.description} onChange={(event) => changeDraft('description', event.target.value)} aria-invalid={Boolean(fieldErrors.description)} />{fieldErrors.description && <small role="alert">{fieldErrors.description}</small>}</label>
                <label className="task-field"><span>Status</span><select value={draft.status} onChange={(event) => changeDraft('status', event.target.value)}>{TASK_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label>
                <label className="task-field"><span>Priority</span><select value={draft.priority} onChange={(event) => changeDraft('priority', event.target.value)}>{TASK_PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_LABELS[value]}</option>)}</select></label>
                <label className="task-field"><span>Assignee ID</span><input value={draft.assigneeId} onChange={(event) => changeDraft('assigneeId', event.target.value)} /></label>
                <label className="task-field"><span>Due date</span><input type="date" value={draft.dueDate} onChange={(event) => changeDraft('dueDate', event.target.value)} aria-invalid={Boolean(fieldErrors.dueDate)} aria-describedby={fieldErrors.dueDate ? 'task-due-error' : undefined} />{fieldErrors.dueDate && <small id="task-due-error" role="alert">{fieldErrors.dueDate}</small>}</label>
                <label className="task-field"><span>Project ID</span><input value={draft.projectId} onChange={(event) => changeDraft('projectId', event.target.value)} /></label>
                <label className="task-field"><span>Lead ID</span><input value={draft.leadId} onChange={(event) => changeDraft('leadId', event.target.value)} /></label>
                <label className="task-field"><span>Customer ID</span><input value={draft.customerId} onChange={(event) => changeDraft('customerId', event.target.value)} /></label>
              </div>
              <div className="task-form-actions"><button className="task-button task-button--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create task'}</button><button className="task-button" type="button" onClick={resetForm} disabled={saving}>Cancel</button></div>
            </form>
          </section>}

          {loading ? (
            <section className="task-state" role="status"><LoaderCircle className="task-spin" aria-hidden="true" /><p>Loading tasks…</p></section>
          ) : items.length === 0 ? (
            <section className="task-state task-state--empty"><ClipboardList aria-hidden="true" /><h2>No tasks found</h2><p>Create a task or adjust your search and filters to find matching work.</p>{permissions.canCreate && <button className="task-button task-button--primary" type="button" onClick={startCreate}><Plus size={15} aria-hidden="true" /> Create task</button>}</section>
          ) : isBoard ? (
            <section className="task-board" aria-label="Tasks grouped by status">
              {TASK_STATUSES.filter((value) => value !== 'cancelled').map((value) => {
                const group = items.filter((task) => task.status === value);
                return <article className="task-board__column" key={value}><header><h2>{STATUS_LABELS[value]}</h2><span>{group.length}</span></header>{group.length === 0 ? <p className="task-muted">No tasks</p> : group.map((task) => <article className="task-board-card" key={task.id}><span className={'task-priority task-priority--' + task.priority}>{PRIORITY_LABELS[task.priority] || task.priority}</span><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-board-card__meta"><span>{task.assigneeId || 'Unassigned'}</span><span><CalendarDays aria-hidden="true" size={13} /> {toDateLabel(task.dueDate)}</span></div>{permissions.canUpdate && <label className="task-status-control"><span>Move to</span><select aria-label={'Status for ' + task.title} value={task.status} disabled={busyId === task.id} onChange={(event) => void changeStatus(task, event.target.value)}>{TASK_STATUSES.map((next) => <option value={next} key={next}>{STATUS_LABELS[next]}</option>)}</select></label>}</article>)}</article>;
              })}
            </section>
          ) : (
            <section className="task-table-wrap" aria-label="Task list">
              <table className="task-table"><thead><tr><th scope="col">Task</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Assignee</th><th scope="col">Due date</th><th scope="col">Actions</th></tr></thead><tbody>
                {items.map((task) => <tr key={task.id}><td><strong>{task.title}</strong><small>{task.description || 'No description'}</small></td><td><span className={'task-status task-status--' + task.status}>{STATUS_LABELS[task.status] || task.status}</span></td><td><span className={'task-priority task-priority--' + task.priority}>{PRIORITY_LABELS[task.priority] || task.priority}</span></td><td>{task.assigneeId || 'Unassigned'}</td><td>{toDateLabel(task.dueDate)}</td><td><div className="task-row-actions">{permissions.canUpdate && <button className="task-icon-button" type="button" aria-label={'Edit ' + task.title} onClick={() => startEdit(task)}><Pencil aria-hidden="true" size={15} /></button>}{permissions.canDelete && <button className="task-icon-button task-icon-button--danger" type="button" aria-label={'Delete ' + task.title} disabled={busyId === task.id} onClick={() => void deleteTask(task)}><Trash2 aria-hidden="true" size={15} /></button>}{!permissions.canUpdate && !permissions.canDelete && <span className="task-muted">View only</span>}</div></td></tr>)}
              </tbody></table>
            </section>
          )}

          {!loading && !isBoard && items.length > 0 && <nav className="task-pagination" aria-label="Task pagination"><span>Showing {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} of {total}</span><div><button className="task-button" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {page} of {pageCount}</span><button className="task-button" type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></nav>}
        </>
      )}
      <p className="task-footnote">Task actions are validated in the UI for usability; the backend must enforce authentication, permissions, and organization/project membership on every request.</p>
    </main>
  );
}

export default TaskManagementView;
