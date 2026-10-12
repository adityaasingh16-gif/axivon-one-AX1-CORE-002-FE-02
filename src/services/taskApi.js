const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class TaskApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'TaskApiError';
    this.status = status;
    this.details = details;
  }
}

function normaliseTask(task) {
  if (!task || typeof task !== 'object') return task;
  return {
    ...task,
    id: task.id ?? task._id ?? task.taskId ?? task.task_id,
    assigneeId: task.assigneeId ?? task.assignee_id ?? '',
    dueDate: task.dueDate ?? task.due_date ?? '',
    projectId: task.projectId ?? task.project_id ?? '',
    leadId: task.leadId ?? task.lead_id ?? '',
    customerId: task.customerId ?? task.customer_id ?? '',
  };
}

export function normaliseTaskPage(payload, query = {}) {
  if (Array.isArray(payload)) {
    const items = payload.map(normaliseTask);
    const pageSize = Number(query.pageSize || Math.max(items.length, 1));
    return { items, total: items.length, page: Number(query.page || 1), pageSize, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) };
  }
  const source = payload && typeof payload === 'object' ? payload : {};
  const items = (Array.isArray(source.items) ? source.items : Array.isArray(source.tasks) ? source.tasks : []).map(normaliseTask);
  const meta = source.meta || {};
  const total = Number(source.total ?? meta.total ?? items.length);
  const page = Number(source.page ?? meta.page ?? query.page ?? 1);
  const pageSize = Number(source.pageSize ?? meta.pageSize ?? query.pageSize ?? 10);
  return { items, total, page, pageSize, totalPages: Number(source.totalPages ?? meta.totalPages ?? Math.ceil(total / Math.max(pageSize, 1))) };
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', 'Bearer ' + options.token);
  const organizationId = options.organizationId || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_suite_active_org_id') : null);
  if (organizationId) headers.set('x-organization-id', organizationId);

  const response = await fetch(API_BASE_URL + path, {
    method: options.method || 'GET',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (response.status === 204) return undefined;
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    throw new TaskApiError(
      payload?.error?.message || payload?.message || ('Task request failed (' + response.status + ').'),
      response.status,
      payload?.error?.details ?? payload
    );
  }
  return payload?.data ?? payload;
}

export const taskApi = {
  async list({ token, organizationId, query = {}, signal } = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') params.set(key, String(value));
    });
    const suffix = params.toString() ? '?' + params.toString() : '';
    const payload = await request('/api/v1/tasks' + suffix, { token, organizationId, signal });
    return normaliseTaskPage(payload, query);
  },
  create(draft, context = {}) {
    return request('/api/v1/tasks', { ...context, method: 'POST', body: draft }).then(normaliseTask);
  },
  update(id, draft, context = {}) {
    return request('/api/v1/tasks/' + encodeURIComponent(id), { ...context, method: 'PATCH', body: draft }).then(normaliseTask);
  },
  remove(id, context = {}) {
    return request('/api/v1/tasks/' + encodeURIComponent(id), { ...context, method: 'DELETE' });
  },
};
