import type {
  NotificationPage,
  NotificationPreferences,
  NotificationRecord,
  NotificationsApi,
  NotificationsState,
} from './types.js';
import { validateNotificationId, validatePreferences, hasPreferenceErrors } from './validation.js';

const initialPage: NotificationPage = {
  items: [], page: 1, pageSize: 20, total: 0, unreadCount: 0, hasNextPage: false,
};

export class NotificationsController {
  private state: NotificationsState = {
    status: 'idle', page: null, selected: null, preferences: null, errorMessage: null, actionId: null,
  };
  private readonly listeners = new Set<(state: NotificationsState) => void>();

  constructor(private readonly api: NotificationsApi) {}

  getState(): NotificationsState { return this.state; }
  subscribe(listener: (state: NotificationsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<NotificationsState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  async load(query: Parameters<NotificationsApi['list']>[0] = {}): Promise<void> {
    this.setState({ status: 'loading', errorMessage: null, actionId: null });
    try {
      const page = await this.api.list(query);
      this.setState({ status: page.items.length ? 'success' : 'empty', page, errorMessage: null });
    } catch (error) {
      this.setState({ status: 'error', errorMessage: error instanceof Error ? error.message : 'Unable to load notifications.' });
    }
  }

  async select(id: string): Promise<NotificationRecord | null> {
    const error = validateNotificationId(id);
    if (error) { this.setState({ status: 'error', errorMessage: error }); return null; }
    this.setState({ actionId: id, errorMessage: null });
    try {
      const notification = await this.api.get(id);
      this.setState({ selected: notification, actionId: null });
      return notification;
    } catch (reason) {
      this.setState({ actionId: null, status: 'error', errorMessage: reason instanceof Error ? reason.message : 'Unable to open notification.' });
      return null;
    }
  }

  async setRead(id: string, read: boolean): Promise<boolean> {
    const error = validateNotificationId(id);
    if (error) { this.setState({ status: 'error', errorMessage: error }); return false; }
    this.setState({ actionId: id, errorMessage: null });
    try {
      const updated = read ? await this.api.markRead(id) : await this.api.markUnread(id);
      const page = this.state.page ?? initialPage;
      const items = page.items.map((item) => item.id === id ? updated : item);
      const unreadCount = items.filter((item) => !item.read).length;
      this.setState({ actionId: null, page: { ...page, items, unreadCount }, selected: this.state.selected?.id === id ? updated : this.state.selected });
      return true;
    } catch (reason) {
      this.setState({ actionId: null, status: 'error', errorMessage: reason instanceof Error ? reason.message : 'Unable to update notification.' });
      return false;
    }
  }

  async loadPreferences(): Promise<void> {
    this.setState({ status: 'loading', errorMessage: null });
    try {
      const preferences = await this.api.getPreferences();
      this.setState({ status: 'success', preferences });
    } catch (reason) {
      this.setState({ status: 'error', errorMessage: reason instanceof Error ? reason.message : 'Unable to load notification preferences.' });
    }
  }

  async savePreferences(value: NotificationPreferences): Promise<boolean> {
    if (hasPreferenceErrors(validatePreferences(value))) {
      this.setState({ status: 'error', errorMessage: 'Please correct the notification preferences.' });
      return false;
    }
    this.setState({ actionId: 'preferences', errorMessage: null });
    try {
      const preferences = await this.api.updatePreferences(value);
      this.setState({ status: 'success', preferences, actionId: null });
      return true;
    } catch (reason) {
      this.setState({ status: 'error', actionId: null, errorMessage: reason instanceof Error ? reason.message : 'Unable to save notification preferences.' });
      return false;
    }
  }
}
