import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTaskPermissions, validateTaskDraft } from '../src/utils/taskValidation';
import { normaliseTaskPage, taskApi } from '../src/services/taskApi';

afterEach(() => vi.unstubAllGlobals());

describe('BUS-005 task validation and role mapping', () => {
  it('requires a meaningful title and validates real calendar dates', () => {
    expect(validateTaskDraft({ title: ' ', dueDate: '' }).title).toBe('Task title is required.');
    expect(validateTaskDraft({ title: 'AB', dueDate: '' }).title).toContain('at least 3');
    expect(validateTaskDraft({ title: 'Plan release', dueDate: '2026-02-29' }).dueDate).toBe('Enter a valid due date.');
    expect(validateTaskDraft({ title: 'Plan release', dueDate: '2024-02-29' })).toEqual({});
  });

  it('fails closed for unauthenticated users and limits destructive actions', () => {
    expect(getTaskPermissions(null)).toEqual({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
    expect(getTaskPermissions({ role: 'member' })).toEqual({ canRead: true, canCreate: false, canUpdate: false, canDelete: false });
    expect(getTaskPermissions({ role: 'manager' }).canDelete).toBe(true);
    expect(getTaskPermissions({ role: 'hr' }).canDelete).toBe(false);
  });

  it('normalises array and paginated task responses', () => {
    expect(normaliseTaskPage([{ _id: 't1', title: 'Task' }], { page: 1, pageSize: 10 }).items[0].id).toBe('t1');
    expect(normaliseTaskPage({ items: [{ id: 't1' }], total: 15, page: 2, pageSize: 10 }).totalPages).toBe(2);
  });
});

describe('BUS-005 task API', () => {
  it('includes bearer and organization headers and serializes filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await taskApi.list({ token: 'demo-token', organizationId: 'org-1', query: { search: 'release', status: 'todo', priority: 'high', page: 2, pageSize: 10 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/tasks?');
    expect(url).toContain('search=release');
    expect(url).toContain('page=2');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer demo-token');
    expect(new Headers(init.headers).get('x-organization-id')).toBe('org-1');
  });

  it('accepts a 204 no-content delete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(taskApi.remove('task-1', { token: 'demo-token' })).resolves.toBeUndefined();
  });

  it('surfaces authorization errors from the API contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { message: 'Not authorized' } }), { status: 403 })));
    await expect(taskApi.list()).rejects.toThrow('Not authorized');
  });
});
