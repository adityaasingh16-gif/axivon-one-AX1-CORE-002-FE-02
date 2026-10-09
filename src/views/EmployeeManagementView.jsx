import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, Search, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../services/employeeApi';

const EMPTY_DRAFT = { employeeCode: '', firstName: '', lastName: '', email: '', phone: '', department: '', jobTitle: '', managerId: '', employmentType: 'full-time', status: 'active', startDate: '' };
const STATUSES = ['active', 'inactive', 'on-leave', 'terminated'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];
const validateDraft = (draft) => {
  const errors = {};
  ['employeeCode', 'firstName', 'lastName', 'department', 'jobTitle', 'startDate'].forEach((key) => { if (!String(draft[key] || '').trim()) errors[key] = 'This field is required.'; });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email || '').trim())) errors.email = 'Enter a valid email address.';
  if (draft.phone && !/^[+\d() .-]{7,20}$/.test(draft.phone)) errors.phone = 'Enter a valid phone number.';
  return errors;
};

export const EmployeeManagementView = () => {
  const { token, user, showToast } = useAuth();
  const canManage = ['admin', 'hr', 'manager'].includes(String(user?.role || '').toLowerCase());
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formOpen, setFormOpen] = useState(false);

  const loadEmployees = useCallback(async (signal) => {
    if (!token) { setLoading(false); setError('Your session is missing. Please sign in again.'); return; }
    setLoading(true); setError('');
    try {
      const result = await employeeApi.list({ token, search: query, status, department, page: 1, pageSize: 100, signal });
      setItems(Array.isArray(result?.items) ? result.items : []);
    } catch (cause) {
      if (cause?.name === 'AbortError') return;
      setError(cause?.status === 401 ? 'The backend rejected this session. The current demo login token may not be a backend-issued token.' : (cause.message || 'Unable to load employees.'));
    } finally { setLoading(false); }
  }, [token, query, status, department]);

  useEffect(() => {
    const controller = new AbortController();
    loadEmployees(controller.signal);
    return () => controller.abort();
  }, [loadEmployees]);

  const departments = useMemo(() => [...new Set(items.map((employee) => employee.department).filter(Boolean))].sort(), [items]);
  const resetForm = () => { setDraft(EMPTY_DRAFT); setEditingId(''); setFieldErrors({}); setFormOpen(false); };
  const submit = async (event) => {
    event.preventDefault();
    const errors = validateDraft(draft); setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true); setError(''); setNotice('');
    const payload = { ...draft, employeeCode: draft.employeeCode.trim(), firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim(), phone: draft.phone.trim(), department: draft.department.trim(), jobTitle: draft.jobTitle.trim(), managerId: draft.managerId.trim() };
    try {
      if (editingId) await employeeApi.update(editingId, payload, { token }); else await employeeApi.create(payload, { token });
      setNotice(editingId ? 'Employee record updated.' : 'Employee record created.');
      if (showToast) showToast(editingId ? 'Employee updated successfully.' : 'Employee created successfully.', 'success');
      resetForm(); await loadEmployees();
    } catch (cause) { setError(cause.message || 'Unable to save employee.'); }
    finally { setSaving(false); }
  };
  const startEdit = (employee) => {
    setDraft({ employeeCode: employee.employeeCode || '', firstName: employee.firstName || '', lastName: employee.lastName || '', email: employee.email || '', phone: employee.phone || '', department: employee.department || '', jobTitle: employee.jobTitle || '', managerId: employee.managerId || '', employmentType: employee.employmentType || 'full-time', status: employee.status || 'active', startDate: employee.startDate || '' });
    setEditingId(employee.id); setFieldErrors({}); setFormOpen(true);
  };
  const changeStatus = async (employee, nextStatus) => {
    setBusyId(employee.id); setError(''); setNotice('');
    try { await employeeApi.updateStatus(employee.id, nextStatus, { token }); setNotice('Employee status updated.'); await loadEmployees(); }
    catch (cause) { setError(cause.message || 'Unable to update employee status.'); }
    finally { setBusyId(''); }
  };
  const removeEmployee = async (employee) => {
    if (!window.confirm('Delete ' + employee.firstName + ' ' + employee.lastName + ' from the employee directory?')) return;
    setBusyId(employee.id); setError(''); setNotice('');
    try { await employeeApi.remove(employee.id, { token }); setNotice('Employee record deleted.'); await loadEmployees(); }
    catch (cause) { setError(cause.message || 'Unable to delete employee.'); }
    finally { setBusyId(''); }
  };
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
  const field = (key, label, type = 'text') => <label key={key} className="block text-xs font-semibold text-slate-700">{label}<input className={inputClass + ' mt-1.5'} type={type} value={draft[key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} aria-invalid={Boolean(fieldErrors[key])} aria-describedby={fieldErrors[key] ? 'employee-' + key + '-error' : undefined} />{fieldErrors[key] && <span id={'employee-' + key + '-error'} role="alert" className="mt-1 block text-[11px] font-medium text-red-600">{fieldErrors[key]}</span>}</label>;

  return <div className="space-y-6 pb-12">
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Users className="h-5 w-5" /></div><div><h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Employee Management</h1><p className="mt-1 text-xs text-slate-500">Directory, employment details and employee status.</p></div></div>
      {canManage && <button type="button" onClick={() => { resetForm(); setFormOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Add employee</button>}
    </header>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{error}</div><button type="button" onClick={() => void loadEmployees()} className="font-bold underline">Retry</button></div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_200px_auto] md:items-end">
        <label className="block text-xs font-semibold text-slate-700">Search employees<div className="relative mt-1.5"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={inputClass + ' pl-9'} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setQuery(search); }} placeholder="Name, code, email or department" /></div></label>
        <label className="block text-xs font-semibold text-slate-700">Status<select className={inputClass + ' mt-1.5'} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-700">Department<select className={inputClass + ' mt-1.5'} value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{departments.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <button type="button" onClick={() => setQuery(search)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Search</button>
      </div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? <div role="status" className="py-16 text-center text-sm text-slate-500"><Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" /><p className="mt-2">Loading employees…</p></div>
        : items.length === 0 ? <div className="px-5 py-16 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 text-sm font-bold text-slate-800">No employees found</h2><p className="mt-1 text-xs text-slate-500">Adjust your filters or add an employee if you have permission.</p></div>
        : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Job title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Start date</th>{canManage && <th className="px-4 py-3">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100">{items.map((employee) => <tr key={employee.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-bold text-slate-900">{employee.firstName} {employee.lastName}</p><p className="mt-1 text-[10px] text-slate-500">{employee.employeeCode} · {employee.email}</p></td><td className="px-4 py-3 text-slate-700">{employee.department}</td><td className="px-4 py-3 text-slate-700">{employee.jobTitle}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{employee.status}</span></td><td className="px-4 py-3 text-slate-600">{employee.startDate}</td>{canManage && <td className="space-x-2 whitespace-nowrap px-4 py-3"><button type="button" disabled={busyId === employee.id} onClick={() => startEdit(employee)} className="font-bold text-indigo-600 hover:text-indigo-800">Edit</button><select aria-label={'Change status for ' + employee.firstName + ' ' + employee.lastName} disabled={busyId === employee.id} value={employee.status} onChange={(event) => void changeStatus(employee, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1">{STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="button" disabled={busyId === employee.id} onClick={() => void removeEmployee(employee)} className="font-bold text-red-600 hover:text-red-800">Delete</button></td>}</tr>)}</tbody></table></div>}
    </section>
    {formOpen && canManage && <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="employee-form-title" className="my-4 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 id="employee-form-title" className="text-lg font-extrabold text-slate-900">{editingId ? 'Edit employee' : 'Add employee'}</h2><p className="mt-1 text-xs text-slate-500">Employee details are validated before saving.</p></div><button type="button" aria-label="Close employee form" onClick={resetForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><form onSubmit={submit} noValidate><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{field('employeeCode', 'Employee code')}{field('firstName', 'First name')}{field('lastName', 'Last name')}{field('email', 'Email', 'email')}{field('phone', 'Phone')}{field('department', 'Department')}{field('jobTitle', 'Job title')}{field('managerId', 'Manager ID')}{field('startDate', 'Start date', 'date')}<label className="block text-xs font-semibold text-slate-700">Employment type<select className={inputClass + ' mt-1.5'} value={draft.employmentType} onChange={(event) => setDraft((current) => ({ ...current, employmentType: event.target.value }))}>{EMPLOYMENT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="block text-xs font-semibold text-slate-700">Status<select className={inputClass + ' mt-1.5'} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create employee'}</button></div></form></section></div>}
  </div>;
};
