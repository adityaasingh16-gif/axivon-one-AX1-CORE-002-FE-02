import type { AuthGuard } from '../../../core/authentication/backend/http/middleware.js';
import { jsonHeaders, type HttpRequest, type HttpResponse, type HttpMethod } from '../../../core/authentication/backend/http/types.js';

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export interface EmployeeRecord {
  id: string; employeeCode: string; firstName: string; lastName: string; email: string; phone: string | null;
  department: string; jobTitle: string; managerId: string | null; employmentType: EmploymentType;
  status: EmployeeStatus; startDate: string; createdAt: string; updatedAt: string; organizationId: string | null;
}
export interface EmployeeDraft {
  employeeCode: string; firstName: string; lastName: string; email: string; phone?: string;
  department: string; jobTitle: string; managerId?: string; employmentType: EmploymentType;
  status?: EmployeeStatus; startDate: string;
}
type ValidatedEmployee = Omit<EmployeeDraft, 'status'> & { status: EmployeeStatus };
export interface EmployeeRouter {
  routes(): readonly { method: HttpMethod; path: string; operationId: string }[];
  handle(request: HttpRequest): Promise<HttpResponse>;
}
export interface EmployeeModule { router: EmployeeRouter; }

const statuses = new Set<EmployeeStatus>(['active', 'inactive', 'on-leave', 'terminated']);
const employmentTypes = new Set<EmploymentType>(['full-time', 'part-time', 'contract', 'intern']);
let nextId = 3;
const now = () => new Date().toISOString();
const seed: EmployeeRecord[] = [
  { id:'emp-1', employeeCode:'EMP-001', firstName:'Aarav', lastName:'Mehta', email:'aarav.mehta@example.com', phone:null, department:'Engineering', jobTitle:'Frontend Developer', managerId:null, employmentType:'full-time', status:'active', startDate:'2025-02-10', createdAt:now(), updatedAt:now(), organizationId:null },
  { id:'emp-2', employeeCode:'EMP-002', firstName:'Priya', lastName:'Shah', email:'priya.shah@example.com', phone:null, department:'People', jobTitle:'HR Specialist', managerId:null, employmentType:'full-time', status:'on-leave', startDate:'2024-08-19', createdAt:now(), updatedAt:now(), organizationId:null },
];
const store = new Map(seed.map((employee) => [employee.id, employee]));
const json = (status: number, body: unknown): HttpResponse => ({ status, headers: jsonHeaders(), body });
const success = <T,>(data: T, status = 200): HttpResponse => json(status, { success:true, data, timestamp:now() });
const failure = (status: number, code: string, message: string): HttpResponse =>
  json(status, { success:false, error:{ code, message, details:[] }, timestamp:now() });

const validate = (body: unknown): ValidatedEmployee => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('A valid employee payload is required.');
  const value = body as Record<string, unknown>;
  for (const field of ['employeeCode','firstName','lastName','email','department','jobTitle','startDate']) {
    if (typeof value[field] !== 'string' || !value[field].trim()) throw new Error(`${field} is required.`);
  }
  const email = String(value.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email address is required.');
  const employmentType = (value.employmentType ?? 'full-time') as EmploymentType;
  if (!employmentTypes.has(employmentType)) throw new Error('Invalid employment type.');
  const status = (value.status ?? 'active') as EmployeeStatus;
  if (!statuses.has(status)) throw new Error('Invalid employee status.');
  return {
    employeeCode:String(value.employeeCode).trim(), firstName:String(value.firstName).trim(),
    lastName:String(value.lastName).trim(), email, phone:typeof value.phone === 'string' ? value.phone.trim() : '',
    department:String(value.department).trim(), jobTitle:String(value.jobTitle).trim(),
    managerId:typeof value.managerId === 'string' ? value.managerId.trim() : '',
    employmentType, status, startDate:String(value.startDate).trim(),
  };
};

export const createEmployeeModule = (authGuard: AuthGuard): EmployeeModule => {
  const isAuthenticated = async (request: HttpRequest) => (await authGuard.authenticate(request)).authenticated;
  const list = async (request: HttpRequest): Promise<HttpResponse> => {
    if (!await isAuthenticated(request)) return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
    const url = new URL(request.path, 'http://axivon.internal');
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const status = url.searchParams.get('status');
    const department = url.searchParams.get('department');
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 10) || 10));
    const items = [...store.values()]
      .filter((employee) => !search || [employee.employeeCode, employee.firstName, employee.lastName, employee.email, employee.department, employee.jobTitle].some((field) => field.toLowerCase().includes(search)))
      .filter((employee) => !status || status === 'all' || employee.status === status)
      .filter((employee) => !department || department === 'all' || employee.department === department);
    const start = (page - 1) * pageSize;
    return success({ items:items.slice(start, start + pageSize), total:items.length, page, pageSize, totalPages:Math.ceil(items.length / pageSize) });
  };
  const create = async (request: HttpRequest): Promise<HttpResponse> => {
    if (!await isAuthenticated(request)) return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
    const draft = validate(request.body);
    if ([...store.values()].some((employee) => employee.email === draft.email || employee.employeeCode.toLowerCase() === draft.employeeCode.toLowerCase())) {
      return failure(409, 'EMPLOYEE_EXISTS', 'Employee email and employee code must be unique.');
    }
    const timestamp = now();
    const employee: EmployeeRecord = { ...draft, id:`emp-${nextId++}`, phone:draft.phone || null, managerId:draft.managerId || null, createdAt:timestamp, updatedAt:timestamp, organizationId:null };
    store.set(employee.id, employee);
    return success(employee, 201);
  };
  const update = async (request: HttpRequest, id: string): Promise<HttpResponse> => {
    if (!await isAuthenticated(request)) return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
    const current = store.get(id);
    if (!current) return failure(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
    const draft = validate({ ...current, ...(request.body as object) });
    if ([...store.values()].some((employee) => employee.id !== id && (employee.email === draft.email || employee.employeeCode.toLowerCase() === draft.employeeCode.toLowerCase()))) {
      return failure(409, 'EMPLOYEE_EXISTS', 'Employee email and employee code must be unique.');
    }
    const employee: EmployeeRecord = { ...current, ...draft, phone:draft.phone || null, managerId:draft.managerId || null, updatedAt:now() };
    store.set(id, employee);
    return success(employee);
  };
  const remove = async (request: HttpRequest, id: string): Promise<HttpResponse> => {
    if (!await isAuthenticated(request)) return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
    if (!store.delete(id)) return failure(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
    return success({ deleted:true });
  };
  const updateStatus = async (request: HttpRequest, id: string): Promise<HttpResponse> => {
    if (!await isAuthenticated(request)) return failure(401, 'UNAUTHENTICATED', 'Authentication required.');
    const employee = store.get(id);
    if (!employee) return failure(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
    const body = request.body as { status?: unknown } | undefined;
    if (!body || !statuses.has(body.status as EmployeeStatus)) return failure(400, 'INVALID_STATUS', 'A valid employee status is required.');
    employee.status = body.status as EmployeeStatus;
    employee.updatedAt = now();
    return success(employee);
  };
  const patterns: { method: HttpMethod; path: string; operationId: string; run: (request: HttpRequest, id: string) => Promise<HttpResponse> }[] = [
    { method:'GET', path:'/api/v1/employees', operationId:'employees.list', run:(request) => list(request) },
    { method:'POST', path:'/api/v1/employees', operationId:'employees.create', run:(request) => create(request) },
    { method:'PATCH', path:'/api/v1/employees/:id', operationId:'employees.update', run:(request, id) => update(request, id) },
    { method:'DELETE', path:'/api/v1/employees/:id', operationId:'employees.delete', run:(request, id) => remove(request, id) },
    { method:'PATCH', path:'/api/v1/employees/:id/status', operationId:'employees.status', run:(request, id) => updateStatus(request, id) },
  ];
  const match = (pattern: string, path: string): string | null => {
    const expected = pattern.split('/').filter(Boolean);
    const actual = path.split('/').filter(Boolean);
    if (expected.length !== actual.length) return null;
    for (let index = 0; index < expected.length; index++) {
      if (expected[index]!.startsWith(':')) return decodeURIComponent(actual[index]!);
      if (expected[index] !== actual[index]) return null;
    }
    return null;
  };
  return {
    router: {
      routes:() => patterns.map(({ method, path, operationId }) => ({ method, path, operationId })),
      handle:async (request) => {
        try {
          const pathname = new URL(request.path, 'http://axivon.internal').pathname;
          for (const route of patterns) {
            if (route.method !== request.method) continue;
            const id = match(route.path, pathname);
            if (route.path === pathname || id !== null) return route.run(request, id ?? '');
          }
          return failure(404, 'ROUTE_NOT_FOUND', 'Employee route not found.');
        } catch (error) {
          return failure(400, 'EMPLOYEE_REQUEST_FAILED', error instanceof Error ? error.message : 'Employee request failed.');
        }
      },
    },
  };
};
