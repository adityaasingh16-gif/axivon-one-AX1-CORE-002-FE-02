import type { NotificationPage, NotificationPreferences, NotificationRecord } from '../types.js';
import { validatePreferences } from '../validation.js';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
};

const errorText = (message: string): HTMLParagraphElement => {
  const node = el('p', message);
  node.className = 'notifications__error';
  node.setAttribute('role', 'alert');
  return node;
};

export interface NotificationViewCallbacks {
  onOpen: (notification: NotificationRecord) => void;
  onReadChange: (notification: NotificationRecord) => void;
  onRetry: () => void;
}

export const renderNotifications = (
  container: HTMLElement,
  page: NotificationPage,
  callbacks: NotificationViewCallbacks,
): void => {
  container.replaceChildren();
  container.className = 'notifications';

  const heading = el('h1', 'Notifications');
  container.append(heading);

  const summary = el('p', `${page.unreadCount} unread of ${page.total}`);
  summary.setAttribute('aria-live', 'polite');
  container.append(summary);

  const list = el('ul');
  list.className = 'notifications__list';
  list.setAttribute('aria-label', 'Notifications');

  page.items.forEach((notification) => {
    const item = el('li');
    item.className = notification.read ? 'notifications__item' : 'notifications__item notifications__item--unread';
    item.dataset.notificationId = notification.id;

    const content = el('div');
    const title = el('h2', notification.title);
    title.className = 'notifications__title';
    const message = el('p', notification.message);
    const time = el('time', new Date(notification.createdAt).toLocaleString());
    time.dateTime = notification.createdAt;
    content.append(title, message, time);

    const actions = el('div');
    actions.className = 'notifications__actions';
    const open = el('button', 'Open');
    open.type = 'button';
    open.addEventListener('click', () => callbacks.onOpen(notification));
    const toggle = el('button', notification.read ? 'Mark unread' : 'Mark read');
    toggle.type = 'button';
    toggle.setAttribute('aria-pressed', String(notification.read));
    toggle.addEventListener('click', () => callbacks.onReadChange(notification));
    actions.append(open, toggle);

    item.append(content, actions);
    list.append(item);
  });

  if (!page.items.length) {
    const empty = el('p', 'You are all caught up.');
    empty.className = 'notifications__empty';
    container.append(empty);
  } else {
    container.append(list);
  }
};

export const renderNotificationError = (container: HTMLElement, message: string, onRetry: () => void): void => {
  container.replaceChildren();
  container.className = 'notifications';
  container.append(errorText(message));
  const retry = el('button', 'Retry');
  retry.type = 'button';
  retry.addEventListener('click', onRetry);
  container.append(retry);
};

export const renderPreferences = (
  container: HTMLElement,
  value: NotificationPreferences,
  onSubmit: (value: NotificationPreferences) => void,
): void => {
  container.replaceChildren();
  const form = el('form');
  form.className = 'notifications__preferences';
  const heading = el('h2', 'Notification preferences');
  form.append(heading);

  const fields: Array<[keyof Pick<NotificationPreferences, 'inApp' | 'email' | 'push'>, string]> = [
    ['inApp', 'In-app notifications'], ['email', 'Email notifications'], ['push', 'Push notifications'],
  ];
  fields.forEach(([key, label]) => {
    const wrapper = el('label');
    const input = el('input');
    input.type = 'checkbox';
    input.checked = value[key];
    input.name = key;
    wrapper.append(input, document.createTextNode(` ${label}`));
    form.append(wrapper);
  });

  const categories = el('fieldset');
  categories.append(el('legend', 'Categories'));
  Object.entries(value.categories).forEach(([key, enabled]) => {
    const wrapper = el('label');
    const input = el('input');
    input.type = 'checkbox';
    input.checked = enabled;
    input.dataset.category = key;
    wrapper.append(input, document.createTextNode(` ${key}`));
    categories.append(wrapper);
  });
  form.append(categories);

  const status = el('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const submit = el('button', 'Save preferences');
  submit.type = 'submit';
  form.append(submit, status);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const inputs = [...form.querySelectorAll<HTMLInputElement>('input[name]')];
    const next: NotificationPreferences = {
      inApp: inputs.find((input) => input.name === 'inApp')?.checked ?? false,
      email: inputs.find((input) => input.name === 'email')?.checked ?? false,
      push: inputs.find((input) => input.name === 'push')?.checked ?? false,
      categories: Object.fromEntries([...form.querySelectorAll<HTMLInputElement>('input[data-category]')].map((input) => [input.dataset.category ?? '', input.checked])),
    };
    const errors = validatePreferences(next);
    if (Object.keys(errors).length) {
      status.textContent = 'Please correct the notification preferences.';
      status.setAttribute('role', 'alert');
      return;
    }
    status.textContent = 'Saving…';
    status.setAttribute('role', 'status');
    onSubmit(next);
  });

  container.append(form);
};
