import type { UserProfileDraft, UserProfileRecord } from '../types.js';
import { buildUserListState } from './user-list.js';
import { toUserDetailViewModel } from './user-detail.js';
import { validateUserForm } from './user-profile-form.js';

export interface UserManagementViewCallbacks {
  onCreate: (value: UserProfileDraft) => void;
  onEdit: (user: UserProfileRecord) => void;
  onStatusChange: (user: UserProfileRecord) => void;
  onView: (user: UserProfileRecord) => void;
}

const create = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};

const fieldError = (id: string, message?: string): HTMLParagraphElement | undefined => {
  if (!message) return undefined;
  const error = create('p', message);
  error.id = `${id}-error`;
  error.className = 'user-management__error';
  error.setAttribute('role', 'alert');
  return error;
};

/** Accessible, framework-neutral view primitives for the current frontend scaffold. */
export const renderUserList = (
  container: HTMLElement,
  users: readonly UserProfileRecord[],
  callbacks: Pick<UserManagementViewCallbacks, 'onEdit' | 'onStatusChange' | 'onView'>,
): void => {
  container.replaceChildren();
  container.className = 'user-management';

  const heading = create('h1', 'User profiles');
  container.append(heading);

  const state = buildUserListState(users, { page: 1, pageSize: 25 });
  const table = create('table');
  table.className = 'user-management__table';
  table.setAttribute('aria-label', `User list, ${state.total} ${state.total === 1 ? 'item' : 'items'}`);
  const caption = create('caption', `Users (${state.total})`);
  table.append(caption);

  const head = create('thead');
  const row = create('tr');
  ['Name', 'Email', 'Status', 'Memberships', 'Actions'].forEach((label) => {
    const th = create('th', label);
    th.scope = 'col';
    row.append(th);
  });
  head.append(row);
  table.append(head);

  const body = create('tbody');
  for (const user of state.items) {
    const userRow = create('tr');
    const name = create('td', `${user.firstName} ${user.lastName}`.trim());
    const email = create('td', user.email);
    const status = create('td', user.status);
    status.className = 'user-management__status';
    const memberships = create('td', String(user.memberships.length));
    const actions = create('td');
    actions.className = 'user-management__actions';

    const view = create('button', 'View');
    view.type = 'button';
    view.className = 'user-management__button';
    view.addEventListener('click', () => callbacks.onView(user));
    const edit = create('button', 'Edit');
    edit.type = 'button';
    edit.className = 'user-management__button';
    edit.addEventListener('click', () => callbacks.onEdit(user));
    const changeStatus = create('button', 'Change status');
    changeStatus.type = 'button';
    changeStatus.className = 'user-management__button';
    changeStatus.addEventListener('click', () => callbacks.onStatusChange(user));
    actions.append(view, edit, changeStatus);

    userRow.append(name, email, status, memberships, actions);
    body.append(userRow);
  }
  table.append(body);
  const wrapper = create('div');
  wrapper.className = 'user-management__table-wrap';
  wrapper.append(table);
  container.append(wrapper);
};

export const renderUserDetail = (
  container: HTMLElement,
  user: UserProfileRecord,
): void => {
  container.replaceChildren();
  container.className = 'user-management';
  const detail = toUserDetailViewModel(user);
  const heading = create('h2', detail.fullName || 'User profile');
  container.append(heading);

  const definition = create('dl');
  const rows: Array<[string, string]> = [
    ['Email', detail.email],
    ['Phone', detail.phone],
    ['Status', detail.status],
    ['Memberships', detail.memberships.map((membership) => `${membership.organizationName} — ${membership.role} (${membership.status})`).join(', ') || 'No memberships'],
  ];
  for (const [label, value] of rows) {
    const term = create('dt', label);
    const description = create('dd', value);
    definition.append(term, description);
  }
  container.append(definition);
};

export const validateAndSubmitUserForm = (
  value: UserProfileDraft,
  callbacks: Pick<UserManagementViewCallbacks, 'onCreate'>,
): boolean => {
  const result = validateUserForm(value);
  if (!result.valid) return false;
  callbacks.onCreate(result.value);
  return true;
};

export { fieldError };
