import type { Employee, EmployeeDraft, EmployeeStatus } from './services/employee-api.js';

export type EmployeeValidationErrors = Partial<Record<keyof EmployeeDraft, string>>;
export function validateEmployeeDraft(draft:EmployeeDraft):EmployeeValidationErrors {
  const errors:EmployeeValidationErrors = {};
  for (const field of ['employeeCode','firstName','lastName','department','jobTitle','startDate'] as const) {
    if (!draft[field]?.trim()) errors[field] = 'This field is required.';
  }
  if (!draft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email address.';
  if (draft.phone && !/^[+\d() .-]{7,20}$/.test(draft.phone)) errors.phone = 'Enter a valid phone number.';
  return errors;
}
export function filterEmployees(items:readonly Employee[], query:string, status:EmployeeStatus|'all' = 'all', department = 'all'):Employee[] {
  const search = query.trim().toLowerCase();
  return items.filter((employee) => !search || [employee.employeeCode, employee.firstName, employee.lastName, employee.email, employee.department, employee.jobTitle].some((field) => field.toLowerCase().includes(search)))
    .filter((employee) => status === 'all' || employee.status === status)
    .filter((employee) => department === 'all' || employee.department === department);
}
export function employeeDisplayName(employee:Pick<Employee, 'firstName'|'lastName'>):string {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ');
}
