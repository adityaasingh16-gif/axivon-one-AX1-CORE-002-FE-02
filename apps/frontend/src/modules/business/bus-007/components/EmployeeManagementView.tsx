import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { employeeApi, type Employee, type EmployeeDraft, type EmployeeStatus } from '../services/employee-api.js';
import { employeeDisplayName, validateEmployeeDraft } from '../employee-workflows.js';

const blankDraft:EmployeeDraft = { employeeCode:'', firstName:'', lastName:'', email:'', phone:'', department:'', jobTitle:'', managerId:'', employmentType:'full-time', status:'active', startDate:'' };
const statuses:EmployeeStatus[] = ['active','inactive','on-leave','terminated'];
const fields = [
  { key:'employeeCode', label:'Employee code' }, { key:'firstName', label:'First name' }, { key:'lastName', label:'Last name' },
  { key:'email', label:'Email' }, { key:'phone', label:'Phone' }, { key:'department', label:'Department' },
  { key:'jobTitle', label:'Job title' }, { key:'managerId', label:'Manager ID' }, { key:'startDate', label:'Start date' },
] as const;
export interface EmployeeManagementViewProps { canManage?:boolean; }
export function EmployeeManagementView({ canManage = false }:EmployeeManagementViewProps) {
  const [items, setItems] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EmployeeStatus|'all'>('all');
  const [department, setDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [notice, setNotice] = useState<string|null>(null);
  const [draft, setDraft] = useState<EmployeeDraft>(blankDraft);
  const [editing, setEditing] = useState<string|null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const page = await employeeApi.list({ search, status, department, page:1, pageSize:100 }); setItems(page.items); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load employees.'); }
    finally { setLoading(false); }
  }, [search, status, department]);
  useEffect(() => { void load(); }, [load]);
  const departments = useMemo(() => Array.from(new Set(items.map((employee) => employee.department))).sort(), [items]);
  const reset = () => { setDraft(blankDraft); setEditing(null); setFieldErrors({}); };
  const submit = async (event:FormEvent) => {
    event.preventDefault();
    const validation = validateEmployeeDraft(draft); setFieldErrors(validation);
    if (Object.keys(validation).length) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      if (editing) await employeeApi.update(editing, draft); else await employeeApi.create(draft);
      reset(); setNotice(editing ? 'Employee updated successfully.' : 'Employee created successfully.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save employee.'); }
    finally { setSaving(false); }
  };
  const edit = (employee:Employee) => {
    setEditing(employee.id);
    setDraft({ employeeCode:employee.employeeCode, firstName:employee.firstName, lastName:employee.lastName, email:employee.email, phone:employee.phone ?? '', department:employee.department, jobTitle:employee.jobTitle, managerId:employee.managerId ?? '', employmentType:employee.employmentType, status:employee.status, startDate:employee.startDate });
    setFieldErrors({});
  };
  const remove = async (id:string) => {
    if (!window.confirm('Delete this employee record?')) return;
    setError(null); setNotice(null);
    try { await employeeApi.remove(id); setNotice('Employee deleted.'); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to delete employee.'); }
  };
  const changeStatus = async (id:string, next:EmployeeStatus) => {
    setError(null);
    try { await employeeApi.updateStatus(id, next); setNotice('Employee status updated.'); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update status.'); }
  };
  return <main className="employee-management" aria-labelledby="employee-title">
    <header><div><h1 id="employee-title">Employee Management</h1><p>Manage employee records, employment details and status.</p></div></header>
    {error && <div role="alert" className="employee-alert employee-alert-error">{error} <button type="button" onClick={() => void load()}>Retry</button></div>}
    {notice && <div role="status" className="employee-alert employee-alert-success">{notice}</div>}
    <section aria-label="Employee directory">
      <div className="employee-toolbar">
        <label>Search employees<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, code, email, department…" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as EmployeeStatus|'all')}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      {loading ? <p role="status">Loading employees…</p> : items.length === 0 ? <div className="employee-empty"><h2>No employees found</h2><p>Try changing the search or filters{canManage ? ', or add an employee.' : '.'}</p></div> :
        <div className="employee-table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Job title</th><th>Status</th><th>Start date</th>{canManage && <th>Actions</th>}</tr></thead><tbody>
          {items.map((employee) => <tr key={employee.id}><td><strong>{employeeDisplayName(employee)}</strong><br/><small>{employee.employeeCode} · {employee.email}</small></td><td>{employee.department}</td><td>{employee.jobTitle}</td><td>{employee.status}</td><td>{employee.startDate}</td>{canManage && <td><button type="button" onClick={() => edit(employee)}>Edit</button> <select aria-label={'Change status for ' + employeeDisplayName(employee)} value={employee.status} onChange={(event) => void changeStatus(employee.id, event.target.value as EmployeeStatus)}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select> <button type="button" onClick={() => void remove(employee.id)}>Delete</button></td>}</tr>)}
        </tbody></table></div>}
    </section>
    {canManage && <section className="employee-form-section"><h2>{editing ? 'Edit employee' : 'Add employee'}</h2><form onSubmit={submit} noValidate>
      <div className="employee-form-grid">{fields.map((field) => <label key={field.key}>{field.label}<input type={field.key === 'email' ? 'email' : field.key === 'startDate' ? 'date' : 'text'} value={draft[field.key] ?? ''} aria-invalid={!!fieldErrors[field.key]} aria-describedby={fieldErrors[field.key] ? field.key + '-error' : undefined} onChange={(event) => setDraft((current) => ({ ...current, [field.key]:event.target.value }))}/>{fieldErrors[field.key] && <small id={field.key + '-error'} role="alert">{fieldErrors[field.key]}</small>}</label>)}
        <label>Employment type<select value={draft.employmentType} onChange={(event) => setDraft((current) => ({ ...current, employmentType:event.target.value as EmployeeDraft['employmentType'] }))}>{['full-time','part-time','contract','intern'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Status<select value={draft.status ?? 'active'} onChange={(event) => setDraft((current) => ({ ...current, status:event.target.value as EmployeeStatus }))}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div><div className="employee-form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create employee'}</button>{editing && <button type="button" onClick={reset} disabled={saving}>Cancel</button>}</div>
    </form></section>}
  </main>;
}
export default EmployeeManagementView;
