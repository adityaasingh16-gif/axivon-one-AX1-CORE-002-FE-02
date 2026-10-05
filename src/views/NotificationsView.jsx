import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Filter, Loader2, RefreshCw, Search, Trash2, AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { notificationApi } from '../services/notificationApi';

const typeIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export const NotificationsView = () => {
  const { token, showToast } = useAuth();
  const { activeOrg } = useOrg();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [state, setState] = useState('loading');
  const [preferencesState, setPreferencesState] = useState('loading');
  const [busyId, setBusyId] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState('');

  const loadNotifications = useCallback(async (signal) => {
    if (!token) return;
    setState('loading');
    try {
      const result = await notificationApi.list({
        token,
        organizationId: activeOrg?.id,
        isRead: filter === 'all' ? undefined : filter === 'read',
        search: query,
        signal,
      });
      setItems(result.items);
      setMeta(result.meta);
      setState(result.items.length ? 'success' : 'empty');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setState('error');
    }
  }, [activeOrg?.id, filter, query, token]);

  const loadPreferences = useCallback(async (signal) => {
    if (!token) return;
    setPreferencesState('loading');
    try {
      setPreferences(await notificationApi.listPreferences({ token, organizationId: activeOrg?.id, signal }));
      setPreferencesState('success');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setPreferencesState('error');
    }
  }, [activeOrg?.id, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadNotifications(controller.signal);
    return () => controller.abort();
  }, [loadNotifications]);

  useEffect(() => {
    const controller = new AbortController();
    loadPreferences(controller.signal);
    return () => controller.abort();
  }, [loadPreferences]);

  const unreadCount = Number(meta.unreadCount ?? items.filter((item) => !item.isRead).length);

  const filteredItems = useMemo(() => items, [items]);

  const markRead = async (item) => {
    setBusyId(item.id);
    try {
      const updated = await notificationApi.markRead(item.id, !item.isRead, { token, organizationId: activeOrg?.id });
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
      showToast(item.isRead ? 'Notification marked as unread.' : 'Notification marked as read.', 'success');
    } catch (error) {
      showToast(error.message, 'error', 'Notification Update Failed');
    } finally {
      setBusyId('');
    }
  };

  const markAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationApi.markAllRead({ token, organizationId: activeOrg?.id });
      setItems((current) => current.map((entry) => ({ ...entry, isRead: true, readAt: new Date().toISOString() })));
      setMeta((current) => ({ ...current, unreadCount: 0 }));
      showToast('All notifications marked as read.', 'success');
    } catch (error) {
      showToast(error.message, 'error', 'Notification Update Failed');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await notificationApi.remove(item.id, { token, organizationId: activeOrg?.id });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast('Notification cleared.', 'success');
    } catch (error) {
      showToast(error.message, 'error', 'Notification Delete Failed');
    } finally {
      setBusyId('');
    }
  };

  const savePreference = async (preference, field, value) => {
    setIsSavingPreference(preference.eventType);
    try {
      const updated = await notificationApi.savePreference({
        organizationId: activeOrg?.id,
        eventType: preference.eventType,
        inAppEnabled: field === 'inAppEnabled' ? value : preference.inAppEnabled,
        emailEnabled: field === 'emailEnabled' ? value : preference.emailEnabled,
        smsEnabled: field === 'smsEnabled' ? value : preference.smsEnabled,
        pushEnabled: field === 'pushEnabled' ? value : preference.pushEnabled,
      }, { token, organizationId: activeOrg?.id });
      setPreferences((current) => current.map((entry) => entry.eventType === updated.eventType ? updated : entry));
      showToast('Notification preference saved.', 'success');
    } catch (error) {
      showToast(error.message, 'error', 'Preference Update Failed');
    } finally {
      setIsSavingPreference('');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Bell className="h-5 w-5" /></div>
              <div><h1 className="text-2xl font-extrabold text-slate-900">Notification Center</h1><p className="mt-1 text-xs text-slate-500">Manage alerts, read state, preferences and delivery status.</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{unreadCount} unread</span>
            <button type="button" onClick={markAllRead} disabled={isMarkingAll || unreadCount === 0} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><CheckCheck className="h-4 w-4" />{isMarkingAll ? 'Updating…' : 'Mark all read'}</button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQuery(search)} placeholder="Search notifications…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setQuery(search)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-indigo-300">Search</button>
            <button type="button" onClick={() => { setSearch(''); setQuery(''); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-indigo-300">Reset</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Filter className="mt-2 h-4 w-4 text-slate-400" />
          {['all', 'unread', 'read'].map((option) => <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ${filter === option ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{option}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {state === 'loading' && <div className="py-16 text-center text-slate-500"><Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" /><p className="mt-2 text-xs">Loading notifications…</p></div>}
        {state === 'error' && <div className="py-16 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-2 text-sm font-semibold text-slate-800">Unable to load notifications</p><button type="button" onClick={() => loadNotifications()} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Retry</button></div>}
        {state === 'empty' && <div className="py-16 text-center text-slate-500"><Bell className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No notifications found</p><p className="mt-1 text-xs">Try another filter or search term.</p></div>}
        {state === 'success' && filteredItems.map((item) => {
          const Icon = typeIcon[item.type] || Info;
          return <article key={item.id} className={`border-b border-slate-100 p-5 last:border-0 ${item.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-indigo-600"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className={`text-sm ${item.isRead ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900'}`}>{item.title}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">{item.priority}</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p>
                <p className="mt-2 text-[10px] text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => markRead(item)} disabled={busyId === item.id} title={item.isRead ? 'Mark unread' : 'Mark read'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><CheckCheck className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(item)} disabled={busyId === item.id} title="Clear notification" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>;
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">Delivery Preferences</h2><p className="mt-1 text-[11px] text-slate-500">Control channels exposed by the notification backend.</p></div><button type="button" onClick={() => loadPreferences()} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-indigo-600"><RefreshCw className="h-4 w-4" /></button></div>
        {preferencesState === 'loading' && <div className="py-8 text-center text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" /><p className="mt-2 text-xs">Loading preferences…</p></div>}
        {preferencesState === 'error' && <div className="py-8 text-center text-red-600 text-xs">Unable to load preferences.</div>}
        {preferencesState === 'success' && preferences.length === 0 && <div className="py-8 text-center text-slate-400 text-xs">No preferences configured.</div>}
        {preferencesState === 'success' && preferences.length > 0 && <div className="mt-4 space-y-3">{preferences.map((preference) => <div key={preference.id || preference.eventType} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold text-slate-800">{preference.eventType}</p><p className="text-[10px] text-slate-400 mt-1">Notification delivery channels</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['inAppEnabled','In-app'],['emailEnabled','Email'],['smsEnabled','SMS'],['pushEnabled','Push']].map(([field,label]) => <label key={field} className="flex items-center gap-1.5 text-[10px] text-slate-600"><input type="checkbox" checked={Boolean(preference[field])} disabled={isSavingPreference === preference.eventType} onChange={(e) => savePreference(preference, field, e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600" />{label}</label>)}</div></div></div>)}</div>}
      </section>
    </div>
  );
};
