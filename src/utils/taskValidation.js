export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function validateTaskDraft(draft = {}) {
  const errors = {};
  const title = String(draft.title ?? '').trim();
  const description = String(draft.description ?? '');
  const dueDate = String(draft.dueDate ?? '');

  if (!title) errors.title = 'Task title is required.';
  else if (title.length < 3) errors.title = 'Task title must be at least 3 characters.';
  else if (title.length > 160) errors.title = 'Task title must be 160 characters or fewer.';

  if (description.length > 4000) errors.description = 'Description must be 4,000 characters or fewer.';

  if (dueDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (!match) errors.dueDate = 'Enter a valid due date.';
    else {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        errors.dueDate = 'Enter a valid due date.';
      }
    }
  }

  if (draft.status && !TASK_STATUSES.includes(draft.status)) errors.status = 'Select a valid task status.';
  if (draft.priority && !TASK_PRIORITIES.includes(draft.priority)) errors.priority = 'Select a valid task priority.';
  return errors;
}

/** Mirrors the current app's authenticated role model. Backend authorization remains mandatory. */
export function getTaskPermissions(user) {
  if (!user) return { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
  const role = String(user.role ?? '').trim().toLowerCase();
  const canManage = ['admin', 'owner', 'manager', 'hr'].includes(role);
  const canDelete = ['admin', 'owner', 'manager'].includes(role);
  return { canRead: true, canCreate: canManage, canUpdate: canManage, canDelete };
}
