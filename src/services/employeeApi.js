const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class EmployeeApiError extends Error {
  constructor(message, status, details) { super(message); this.name = 'EmployeeApiError'; this.status = status; this.details = details; }
}
const request = async (path, options = {}) => {
  const token = options.token;
  const response = await fetch(API_BASE_URL + path, {
    method: options.method || 'GET', signal: options.signal,
    headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.success === false) throw new EmployeeApiError(payload?.error?.message || payload?.message || ('Employee request failed (' + response.status + ').'), response.status, payload?.error?.details || payload);
  return payload?.data ?? payload;
};
export const employeeApi = {
  list: ({ token, search = '', status = 'all', department = 'all', page = 1, pageSize = 100, signal } = {}) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) query.set('search', search.trim());
    if (status !== 'all') query.set('status', status);
    if (department !== 'all') query.set('department', department);
    return request('/api/v1/employees?' + query.toString(), { token, signal });
  },
  create: (draft, options = {}) => request('/api/v1/employees', { token: options.token, method: 'POST', body: draft }),
  update: (id, draft, options = {}) => request('/api/v1/employees/' + encodeURIComponent(id), { token: options.token, method: 'PATCH', body: draft }),
  updateStatus: (id, status, options = {}) => request('/api/v1/employees/' + encodeURIComponent(id) + '/status', { token: options.token, method: 'PATCH', body: { status } }),
  remove: (id, options = {}) => request('/api/v1/employees/' + encodeURIComponent(id), { token: options.token, method: 'DELETE' }),
};
