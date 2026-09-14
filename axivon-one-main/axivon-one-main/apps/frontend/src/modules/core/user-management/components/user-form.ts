import { isEmailValid } from '@axivon/validation';
import type { UserStatus } from '@axivon/types';
import type { ManagedUser, MembershipStatus, UserFormValues } from '../types/user-management.types.js';

export interface UserFormCallbacks {
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);

const getValues = (form: HTMLFormElement): UserFormValues => {
  const data = new FormData(form);
  return {
    firstName: String(data.get('firstName') ?? '').trim(),
    lastName: String(data.get('lastName') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    phone: String(data.get('phone') ?? '').trim(),
    status: String(data.get('status') ?? 'active') as UserStatus,
    organizationName: String(data.get('organizationName') ?? '').trim(),
    role: String(data.get('role') ?? 'Member').trim(),
    membershipStatus: String(data.get('membershipStatus') ?? 'active') as MembershipStatus,
  };
};

export const renderUserForm = (container: HTMLElement, user: ManagedUser | null, callbacks: UserFormCallbacks): void => {
  const membership = user?.memberships[0];
  const title = user ? 'Edit user' : 'Create user';
  const values: UserFormValues = {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    status: user?.status ?? 'active',
    organizationName: membership?.organizationName ?? '',
    role: membership?.role ?? 'Member',
    membershipStatus: membership?.status ?? 'active',
  };

  container.innerHTML = `<section class="ax-users-page"><button class="ax-back" data-action="cancel">← Back to users</button><div class="ax-form-header"><div><p class="ax-eyebrow">USER MANAGEMENT</p><h1>${title}</h1><p class="ax-subtitle">${user ? 'Update profile details and membership access.' : 'Add a new user to the organization.'}</p></div></div><form class="ax-card ax-form" novalidate><div class="ax-form-section"><h2>Profile information</h2><div class="ax-form-grid"><label>First name<input name="firstName" required value="${escapeHtml(values.firstName)}" autocomplete="given-name" /></label><label>Last name<input name="lastName" required value="${escapeHtml(values.lastName)}" autocomplete="family-name" /></label><label>Email<input name="email" type="email" required value="${escapeHtml(values.email)}" autocomplete="email" /></label><label>Phone<input name="phone" value="${escapeHtml(values.phone)}" autocomplete="tel" /></label></div></div><div class="ax-form-section"><h2>Account status</h2><div class="ax-form-grid"><label>Status<select name="status"><option value="active" ${values.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${values.status === 'inactive' ? 'selected' : ''}>Inactive</option><option value="pending" ${values.status === 'pending' ? 'selected' : ''}>Pending</option><option value="suspended" ${values.status === 'suspended' ? 'selected' : ''}>Suspended</option></select></label></div></div><div class="ax-form-section"><h2>Organization membership</h2><div class="ax-form-grid"><label>Organization<input name="organizationName" required value="${escapeHtml(values.organizationName)}" /></label><label>Role<input name="role" required value="${escapeHtml(values.role)}" /></label><label>Membership status<select name="membershipStatus"><option value="active" ${values.membershipStatus === 'active' ? 'selected' : ''}>Active</option><option value="invited" ${values.membershipStatus === 'invited' ? 'selected' : ''}>Invited</option><option value="suspended" ${values.membershipStatus === 'suspended' ? 'selected' : ''}>Suspended</option></select></label></div></div><div class="ax-form-error" role="alert" aria-live="polite"></div><div class="ax-form-actions"><button type="button" class="ax-btn ax-btn--secondary" data-action="cancel">Cancel</button><button type="submit" class="ax-btn ax-btn--primary">${user ? 'Save changes' : 'Create user'}</button></div></form></section>`;

  container.querySelectorAll('[data-action="cancel"]').forEach((button) => button.addEventListener('click', callbacks.onCancel));
  const form = container.querySelector<HTMLFormElement>('form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = container.querySelector<HTMLElement>('.ax-form-error');
    if (!form || !error) return;
    const valuesToSubmit = getValues(form);
    const fieldErrors: string[] = [];
    if (!valuesToSubmit.firstName) fieldErrors.push('First name is required.');
    if (!valuesToSubmit.lastName) fieldErrors.push('Last name is required.');
    if (!isEmailValid(valuesToSubmit.email)) fieldErrors.push('Enter a valid email address.');
    if (!valuesToSubmit.organizationName) fieldErrors.push('Organization is required.');
    if (!valuesToSubmit.role) fieldErrors.push('Role is required.');
    if (fieldErrors.length > 0) {
      error.textContent = fieldErrors[0] ?? 'Please check the form.';
      return;
    }
    error.textContent = '';
    await callbacks.onSubmit(valuesToSubmit);
  });
};
