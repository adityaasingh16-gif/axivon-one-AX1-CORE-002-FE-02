import './styles.css';
import { TaskApiClient } from './api.js';
import type { TaskApi, TaskDraft, TaskListQuery, TaskPermissions, TaskRecord, TaskRouteId, TaskStatus, TaskPriority } from './types.js';
import { validateTask } from './validation.js';

export interface TaskManagementViewOptions {
  container: HTMLElement;
  activeRoute?: TaskRouteId;
  api?: TaskApi;
  permissions?: TaskPermissions;
}

const noPermissions: TaskPermissions = { can: () => false };
const permissionCodes: Record<'read' | 'create' | 'update' | 'delete', string> = {
  read: 'tasks.task.read',
  create: 'tasks.task.create',
  update: 'tasks.task.update',
  delete: 'tasks.task.delete',
};

/** Translate the authenticated user's permission codes into safe UI capabilities. */
export const taskPermissionsFromCodes = (codes: readonly string[] | null | undefined): TaskPermissions => {
  const granted = new Set(codes ?? []);
  return { can: permission => granted.has(permissionCodes[permission]) };
};
const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'];
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const statusLabel = (status: TaskStatus): string => ({ todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done', cancelled: 'Cancelled' })[status];
const priorityLabel = (priority: TaskPriority): string => priority.charAt(0).toUpperCase() + priority.slice(1);

export class TaskManagementView {
  private readonly container: HTMLElement;
  private readonly activeRoute: TaskRouteId;
  private readonly api: TaskApi;
  private readonly permissions: TaskPermissions;
  private state = { items: [] as TaskRecord[], loading: true, saving: false, error: null as string | null, page: 1, pageSize: 10, total: 0, query: '', status: 'all' as TaskStatus | 'all', priority: 'all' as TaskPriority | 'all' };

  constructor(options: TaskManagementViewOptions) {
    this.container = options.container;
    this.activeRoute = options.activeRoute ?? 'task-list';
    this.api = options.api ?? new TaskApiClient();
    this.permissions = options.permissions ?? noPermissions;
  }

  async render(): Promise<void> {
    this.renderShell();
    if (!this.permissions.can('read')) {
      const content = this.container.querySelector<HTMLElement>('[data-region="content"]');
      if (content) {
        content.setAttribute('aria-busy', 'false');
        content.innerHTML = '<section class="task-state task-state--error" role="alert"><h2>Access denied</h2><p>You do not have permission to view tasks.</p></section>';
      }
      return;
    }
    await this.load();
  }

  private async load(page = this.state.page): Promise<void> {
    if (!this.permissions.can('read')) return;
    this.state = { ...this.state, loading: true, error: null, page };
    this.renderContent();
    const query: TaskListQuery = { search: this.state.query.trim() || undefined, status: this.state.status, priority: this.state.priority, page, pageSize: this.state.pageSize };
    try {
      const result = await this.api.list(query);
      this.state = { ...this.state, items: result.items, total: result.total, page: result.page, loading: false, error: null };
    } catch (cause) {
      this.state = { ...this.state, loading: false, error: cause instanceof Error ? cause.message : 'Unable to load tasks.' };
    }
    this.renderContent();
  }

  private renderShell(): void {
    this.container.innerHTML = `<section class="task-module" aria-labelledby="task-module-title">
      <header class="task-module__header"><div><p class="task-module__eyebrow">BUS-005 · TASK MANAGEMENT</p><h1 id="task-module-title">${this.activeRoute === 'task-board' ? 'Task Board' : this.activeRoute === 'task-settings' ? 'Task Settings' : 'Task Management'}</h1><p class="task-module__intro">Plan, assign, and track operational work in one place.</p></div>${this.permissions.can('create') && this.activeRoute !== 'task-settings' ? '<button class="task-button task-button--primary" type="button" data-action="new">+ New task</button>' : ''}</header>
      <nav class="task-module__nav" aria-label="Task Management navigation"><a href="/tasks" ${this.activeRoute === 'task-list' ? 'aria-current="page"' : ''}>All tasks</a><a href="/tasks/board" ${this.activeRoute === 'task-board' ? 'aria-current="page"' : ''}>Board</a><a href="/tasks/settings" ${this.activeRoute === 'task-settings' ? 'aria-current="page"' : ''}>Settings</a></nav>
      <main class="task-module__content" data-region="content" aria-live="polite" aria-busy="true"></main>
    </section>`;
    this.container.querySelector('[data-action="new"]')?.addEventListener('click', () => {
      if (this.permissions.can('create')) this.renderForm();
    });
  }

  private renderContent(): void {
    const content = this.container.querySelector<HTMLElement>('[data-region="content"]');
    if (!content) return;
    if (!this.permissions.can('read')) {
      content.setAttribute('aria-busy', 'false');
      content.innerHTML = '<section class="task-state task-state--error" role="alert"><h2>Access denied</h2><p>You do not have permission to view tasks.</p></section>';
      return;
    }
    content.setAttribute('aria-busy', this.state.loading ? 'true' : 'false');
    if (this.state.loading) { content.innerHTML = '<div class="task-state" role="status"><span class="task-spinner" aria-hidden="true"></span><p>Loading tasks…</p></div>'; return; }
    if (this.state.error) {
      content.innerHTML = `<section class="task-state task-state--error" role="alert"><h2>We couldn't load tasks</h2><p>${escapeHtml(this.state.error)}</p><button class="task-button" type="button" data-action="retry">Retry</button></section>`;
      content.querySelector('[data-action="retry"]')?.addEventListener('click', () => void this.load());
      return;
    }
    if (this.activeRoute === 'task-settings') {
      content.innerHTML = '<section class="task-panel"><h2>Task settings</h2><p>Task permissions and organization-specific workflow settings are managed by the shared authorization and settings services.</p><p class="task-muted">No local settings are changed on this page.</p></section>';
      return;
    }
    if (this.activeRoute === 'task-board') { this.renderBoard(content); return; }
    this.renderList(content);
  }

  private renderList(content: HTMLElement): void {
    const completed = this.state.items.filter(task => task.status === 'done').length;
    const active = this.state.items.filter(task => task.status === 'todo' || task.status === 'in_progress').length;
    const blocked = this.state.items.filter(task => task.status === 'blocked').length;
    content.innerHTML = `<section class="task-stats" aria-label="Task summary"><article><span>Tasks found</span><strong>${this.state.total}</strong></article><article><span>Active on this page</span><strong>${active}</strong></article><article><span>Completed on this page</span><strong>${completed}</strong></article><article><span>Blocked on this page</span><strong>${blocked}</strong></article></section>
      <section class="task-toolbar" aria-label="Task filters"><label>Search tasks<input data-field="search" type="search" value="${escapeHtml(this.state.query)}" placeholder="Search by task title"></label><label>Status<select data-field="status"><option value="all">All statuses</option>${statuses.map(s => `<option value="${s}" ${this.state.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}</select></label><label>Priority<select data-field="priority"><option value="all">All priorities</option>${priorities.map(p => `<option value="${p}" ${this.state.priority === p ? 'selected' : ''}>${priorityLabel(p)}</option>`).join('')}</select></label><button class="task-button task-button--primary" type="button" data-action="apply">Apply filters</button><button class="task-button" type="button" data-action="clear">Clear</button></section>
      ${this.state.items.length ? `<div class="task-table-wrap"><table class="task-table"><thead><tr><th scope="col">Task</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Assignee</th><th scope="col">Due date</th><th scope="col">Actions</th></tr></thead><tbody>${this.state.items.map(task => this.row(task)).join('')}</tbody></table></div>` : '<section class="task-empty"><div class="task-empty__icon" aria-hidden="true">✓</div><h2>No tasks found</h2><p>Create a task or adjust your filters to see matching work here.</p></section>'}
      <nav class="task-pagination" aria-label="Task pagination"><span>Showing ${this.state.items.length ? (this.state.page - 1) * this.state.pageSize + 1 : 0}–${Math.min(this.state.page * this.state.pageSize, this.state.total)} of ${this.state.total}</span><div><button class="task-button" type="button" data-action="prev" ${this.state.page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${this.state.page}</span><button class="task-button" type="button" data-action="next" ${this.state.items.length < this.state.pageSize || this.state.page * this.state.pageSize >= this.state.total ? 'disabled' : ''}>Next</button></div></nav>`;
    content.querySelector('[data-action="apply"]')?.addEventListener('click', () => {
      this.state.query = content.querySelector<HTMLInputElement>('[data-field="search"]')?.value ?? '';
      this.state.status = (content.querySelector<HTMLSelectElement>('[data-field="status"]')?.value as TaskStatus | 'all') ?? 'all';
      this.state.priority = (content.querySelector<HTMLSelectElement>('[data-field="priority"]')?.value as TaskPriority | 'all') ?? 'all';
      void this.load(1);
    });
    content.querySelector('[data-action="clear"]')?.addEventListener('click', () => { this.state.query = ''; this.state.status = 'all'; this.state.priority = 'all'; void this.load(1); });
    content.querySelector<HTMLInputElement>('[data-field="search"]')?.addEventListener('keydown', event => { if (event.key === 'Enter') content.querySelector<HTMLButtonElement>('[data-action="apply"]')?.click(); });
    content.querySelector('[data-action="prev"]')?.addEventListener('click', () => void this.load(this.state.page - 1));
    content.querySelector('[data-action="next"]')?.addEventListener('click', () => void this.load(this.state.page + 1));
    content.querySelectorAll<HTMLElement>('[data-edit]').forEach(button => button.addEventListener('click', () => {
      if (!this.permissions.can('update')) return;
      const task = this.state.items.find(item => item.id === button.dataset.edit);
      if (task) this.renderForm(task);
    }));
    content.querySelectorAll<HTMLElement>('[data-delete]').forEach(button => button.addEventListener('click', () => {
      const task = this.state.items.find(item => item.id === button.dataset.delete);
      if (task && this.permissions.can('delete') && window.confirm(`Delete task "${task.title}"? This action cannot be undone.`)) void this.deleteTask(task);
    }));
    content.querySelectorAll<HTMLSelectElement>('[data-status-id]').forEach(select => select.addEventListener('change', () => {
      const task = this.state.items.find(item => item.id === select.dataset.statusId);
      if (task) void this.updateStatus(task, select.value as TaskStatus);
    }));
  }

  private renderBoard(content: HTMLElement): void {
    content.innerHTML = `<section class="task-board" aria-label="Tasks grouped by status">${statuses.filter(s => s !== 'cancelled').map(status => {
      const tasks = this.state.items.filter(task => task.status === status);
      return `<article class="task-board__column"><header><h2>${statusLabel(status)}</h2><span>${tasks.length}</span></header>${tasks.length ? tasks.map(task => `<div class="task-card"><p class="task-card__priority task-card__priority--${task.priority}">${priorityLabel(task.priority)} priority</p><h3>${escapeHtml(task.title)}</h3>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}<div class="task-card__footer"><span>${escapeHtml(task.assigneeId || 'Unassigned')}</span><span>${escapeHtml(formatDate(task.dueDate))}</span></div>${this.permissions.can('update') ? `<label class="task-card__status">Move to<select data-status-id="${escapeHtml(task.id)}">${statuses.map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}</select></label>` : ''}</div>`).join('') : '<p class="task-board__empty">No tasks</p>'}</article>`;
    }).join('')}</section><p class="task-muted">Board columns show the tasks returned for the current page. Use All tasks for search, filtering, and pagination.</p>`;
    content.querySelectorAll<HTMLSelectElement>('[data-status-id]').forEach(select => select.addEventListener('change', () => {
      const task = this.state.items.find(item => item.id === select.dataset.statusId);
      if (task) void this.updateStatus(task, select.value as TaskStatus);
    }));
  }

  private row(task: TaskRecord): string {
    const actions = [this.permissions.can('update') ? `<button class="task-button task-button--small" type="button" data-edit="${escapeHtml(task.id)}">Edit</button>` : '', this.permissions.can('delete') ? `<button class="task-button task-button--small task-button--danger" type="button" data-delete="${escapeHtml(task.id)}">Delete</button>` : ''].join(' ');
    return `<tr><td><div class="task-name">${escapeHtml(task.title)}</div><div class="task-description">${escapeHtml(task.description || 'No description')}</div></td><td><span class="task-status task-status--${task.status}">${statusLabel(task.status)}</span></td><td><span class="task-priority task-priority--${task.priority}">${priorityLabel(task.priority)}</span></td><td>${escapeHtml(task.assigneeId || 'Unassigned')}</td><td>${escapeHtml(formatDate(task.dueDate))}</td><td><div class="task-actions">${actions || '<span class="task-muted">No actions</span>'}</div></td></tr>`;
  }

  private renderForm(existing?: TaskRecord): void {
    if (existing ? !this.permissions.can('update') : !this.permissions.can('create')) return;
    const content = this.container.querySelector<HTMLElement>('[data-region="content"]');
    if (!content) return;
    const value = (key: keyof TaskRecord): string => escapeHtml(String(existing?.[key] ?? ''));
    content.innerHTML = `<section class="task-panel"><header class="task-panel__header"><div><h2>${existing ? 'Edit task' : 'Create task'}</h2><p>Use a clear title and set ownership, priority, and timing.</p></div></header><form class="task-form" data-task-form novalidate>
      <label>Task title <span aria-hidden="true">*</span><input name="title" maxlength="160" value="${value('title')}" required aria-describedby="title-error"><small data-error="title" id="title-error"></small></label>
      <label>Description<textarea name="description" rows="3" maxlength="4000">${value('description')}</textarea></label>
      <div class="task-form__grid"><label>Status<select name="status">${statuses.map(s => `<option value="${s}" ${existing?.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}</select></label><label>Priority<select name="priority">${priorities.map(p => `<option value="${p}" ${existing?.priority === p || (!existing && p === 'medium') ? 'selected' : ''}>${priorityLabel(p)}</option>`).join('')}</select></label><label>Assignee ID<input name="assigneeId" value="${value('assigneeId')}" placeholder="User ID (optional)"></label><label>Due date<input name="dueDate" type="date" value="${value('dueDate')}"><small data-error="dueDate"></small></label><label>Project ID<input name="projectId" value="${value('projectId')}" placeholder="Project ID (optional)"></label><label>Lead ID<input name="leadId" value="${value('leadId')}" placeholder="Lead ID (optional)"></label><label>Customer ID<input name="customerId" value="${value('customerId')}" placeholder="Customer ID (optional)"></label></div>
      <p class="task-form__error" data-form-error role="alert"></p><div class="task-form__actions"><button class="task-button task-button--primary" type="submit">${existing ? 'Save changes' : 'Create task'}</button><button class="task-button" type="button" data-action="cancel-form">Cancel</button></div></form></section>`;
    content.querySelector<HTMLFormElement>('[data-task-form]')?.addEventListener('submit', event => { event.preventDefault(); void this.saveForm(event.currentTarget as HTMLFormElement, existing); });
    content.querySelector('[data-action="cancel-form"]')?.addEventListener('click', () => this.renderContent());
    content.querySelector<HTMLInputElement>('[name="title"]')?.focus();
  }

  private async saveForm(formElement: HTMLFormElement, existing?: TaskRecord): Promise<void> {
    if (existing ? !this.permissions.can('update') : !this.permissions.can('create')) return;
    const content = this.container.querySelector<HTMLElement>('[data-region="content"]');
    if (!content) return;
    const form = new FormData(formElement);
    const draft: TaskDraft = { title: String(form.get('title') ?? '').trim(), description: String(form.get('description') ?? '').trim(), status: String(form.get('status') ?? 'todo') as TaskStatus, priority: String(form.get('priority') ?? 'medium') as TaskPriority, assigneeId: String(form.get('assigneeId') ?? '').trim(), dueDate: String(form.get('dueDate') ?? ''), projectId: String(form.get('projectId') ?? '').trim(), leadId: String(form.get('leadId') ?? '').trim(), customerId: String(form.get('customerId') ?? '').trim() };
    const errors = validateTask(draft);
    content.querySelector<HTMLElement>('[data-error="title"]')!.textContent = errors.title ?? '';
    content.querySelector<HTMLElement>('[data-error="dueDate"]')!.textContent = errors.dueDate ?? '';
    const error = content.querySelector<HTMLElement>('[data-form-error]');
    if (Object.keys(errors).length) { if (error) error.textContent = 'Please correct the highlighted fields.'; content.querySelector<HTMLInputElement>('[name="title"]')?.focus(); return; }
    this.state = { ...this.state, saving: true };
    const submit = formElement.querySelector<HTMLButtonElement>('button[type="submit"]'); if (submit) { submit.disabled = true; submit.textContent = 'Saving…'; }
    try {
      if (existing) await this.api.update(existing.id, draft); else await this.api.create(draft);
      this.state = { ...this.state, saving: false };
      await this.load(1);
    } catch (cause) {
      this.state = { ...this.state, saving: false };
      if (error) error.textContent = cause instanceof Error ? cause.message : 'Unable to save task.';
      if (submit) { submit.disabled = false; submit.textContent = existing ? 'Save changes' : 'Create task'; }
    }
  }

  private async deleteTask(task: TaskRecord): Promise<void> {
    if (!this.permissions.can('delete')) return;
    try { await this.api.remove(task.id); await this.load(this.state.page); }
    catch (cause) { this.state = { ...this.state, error: cause instanceof Error ? cause.message : 'Unable to delete task.' }; this.renderContent(); }
  }

  private async updateStatus(task: TaskRecord, status: TaskStatus): Promise<void> {
    if (!this.permissions.can('update')) return;
    try { await this.api.update(task.id, { status }); await this.load(this.state.page); }
    catch (cause) { this.state = { ...this.state, error: cause instanceof Error ? cause.message : 'Unable to update task status.' }; this.renderContent(); }
  }
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};
const escapeHtml = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
