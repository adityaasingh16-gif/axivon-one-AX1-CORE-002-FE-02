import { describe, expect, it } from 'vitest';
import { createEmployeeModule } from '../backend/index.js';
import type { AuthGuard } from '../../../core/authentication/backend/http/middleware.js';
import { employeeDisplayName, filterEmployees, validateEmployeeDraft } from '../../../../apps/frontend/src/modules/business/bus-007/employee-workflows.js';
import type { Employee, EmployeeDraft } from '../../../../apps/frontend/src/modules/business/bus-007/services/employee-api.js';

const draft:EmployeeDraft = { employeeCode:'EMP-TEST-91', firstName:'Sam', lastName:'Lee', email:'sam.test.91@example.com', department:'Engineering', jobTitle:'Developer', employmentType:'full-time', startDate:'2026-10-09' };
const employee:Employee = { ...draft, id:'test-91', phone:null, managerId:null, status:'active', createdAt:'2026-10-09T00:00:00.000Z', updatedAt:'2026-10-09T00:00:00.000Z', organizationId:null };
const allowed = { authenticate:async () => ({ authenticated:true, session:{} as never, token:'test-token' }) } as AuthGuard;
const denied = { authenticate:async () => ({ authenticated:false, error:new Error('no token') }) } as AuthGuard;
const request = (method:'GET'|'POST'|'PATCH'|'DELETE', path:string, body?:unknown) => ({ method, path, body, headers:{} });

describe('BUS-007 employee workflows', () => {
  it('validates required fields and email', () => {
    expect(validateEmployeeDraft({ ...draft, firstName:'', email:'bad' })).toMatchObject({ firstName:'This field is required.', email:'Enter a valid email address.' });
  });
  it('filters by search, status and department', () => {
    expect(filterEmployees([employee], 'sam', 'active', 'Engineering')).toHaveLength(1);
    expect(filterEmployees([employee], 'missing')).toHaveLength(0);
    expect(filterEmployees([employee], '', 'inactive')).toHaveLength(0);
  });
  it('formats the employee display name', () => { expect(employeeDisplayName(employee)).toBe('Sam Lee'); });
  it('lists seed data when authenticated, including query strings', async () => {
    const response = await createEmployeeModule(allowed).router.handle(request('GET', '/api/v1/employees?page=1&pageSize=10'));
    expect(response.status).toBe(200);
    expect((response.body as {data:{items:unknown[]}}).data.items.length).toBeGreaterThanOrEqual(2);
  });
  it('rejects unauthenticated access', async () => {
    const response = await createEmployeeModule(denied).router.handle(request('GET', '/api/v1/employees'));
    expect(response.status).toBe(401);
  });
  it('creates, changes status, and deletes an employee', async () => {
    const module = createEmployeeModule(allowed);
    const created = await module.router.handle(request('POST', '/api/v1/employees', draft));
    expect(created.status).toBe(201);
    const id = (created.body as {data:{id:string}}).data.id;
    const changed = await module.router.handle(request('PATCH', `/api/v1/employees/${id}/status`, { status:'on-leave' }));
    expect((changed.body as {data:{status:string}}).data.status).toBe('on-leave');
    expect((await module.router.handle(request('DELETE', `/api/v1/employees/${id}`))).status).toBe(200);
  });
  it('rejects duplicate employee codes/emails', async () => {
    const response = await createEmployeeModule(allowed).router.handle(request('POST', '/api/v1/employees', { ...draft, employeeCode:'EMP-001', email:'new.duplicate@example.com' }));
    expect(response.status).toBe(409);
  });
});
