import { useCallback, useEffect, useRef, useState } from 'react';
import type { Workflow, WorkflowApi, WorkflowFormValues, WorkflowStatus } from './contracts';
import { hasValidationErrors, validateWorkflow, type WorkflowValidationErrors } from './workflow-utils';

const PAGE_SIZE = 10;

export function useWorkflowModule(api: WorkflowApi) {
  const [items, setItems] = useState<Workflow[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<WorkflowStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<WorkflowValidationErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkflowFormValues>({ name: '', description: '', owner: '', status: 'draft', steps: 1 });
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async (nextPage = page) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await api.list({ search: query.trim() || undefined, status, page: nextPage, pageSize: PAGE_SIZE }, controller.signal);
      if (!controller.signal.aborted) {
        setItems(response.data);
        setTotal(response.meta.total);
        setPage(response.meta.page);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setItems([]);
        setTotal(0);
        setError(cause instanceof Error ? cause.message : 'Unable to load workflows.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [api, page, query, status]);

  useEffect(() => {
    void load(page);
    return () => requestRef.current?.abort();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', owner: '', status: 'draft', steps: 1 });
    setValidationErrors({});
    setFormError(null);
  };

  const startEdit = (item: Workflow) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description, owner: item.owner, status: item.status, steps: item.steps });
    setValidationErrors({});
    setFormError(null);
  };

  const save = async () => {
    const errors = validateWorkflow(form);
    setValidationErrors(errors);
    if (hasValidationErrors(errors)) return false;
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await api.update(editingId, form);
      else await api.create(form);
      await load(1);
      startCreate();
      return true;
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Unable to save workflow.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await api.remove(id);
      await load(items.length === 1 && page > 1 ? page - 1 : page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete workflow.');
    } finally {
      setDeletingId(null);
    }
  };

  return { items, query, setQuery, status, setStatus, page, setPage, total, loading, saving, deletingId, error, formError, validationErrors, editingId, form, setForm, load, startCreate, startEdit, save, remove };
}
