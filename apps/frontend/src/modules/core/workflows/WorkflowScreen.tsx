import type { ChangeEvent, ReactNode } from 'react';
import type { Workflow, WorkflowApi, WorkflowPermissions, WorkflowStatus } from './contracts';
import { useWorkflowModule } from './useWorkflowModule';

interface WorkflowScreenProps { api: WorkflowApi; permissions: WorkflowPermissions; }
const statuses: WorkflowStatus[] = ['draft', 'active', 'paused'];

export function WorkflowScreen({ api, permissions }: WorkflowScreenProps) {
  const state = useWorkflowModule(api);
  const canCreate = permissions.can('create');
  const canEdit = permissions.can('edit');
  const canDelete = permissions.can('delete');
  const updateForm = (key: keyof typeof state.form, value: string | number) => state.setForm(prev => ({ ...prev, [key]: value }));
  const onNumber = (event: ChangeEvent<HTMLInputElement>) => updateForm('steps', Number(event.target.value));

  return <main style={{ maxWidth: 1180, margin: '0 auto', padding: 24 }} aria-labelledby="workflow-title">
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div><h1 id="workflow-title">Workflows</h1><p>Manage workflow records, status and ownership.</p></div>
      {canCreate && <button type="button" onClick={state.startCreate}>New workflow</button>}
    </header>

    <section aria-label="Workflow filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <label>Search <input value={state.query} onChange={e => state.setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void state.load(1); }} placeholder="Search workflows" /></label>
      <label>Status <select value={state.status} onChange={e => { state.setStatus(e.target.value as WorkflowStatus | 'all'); state.setPage(1); }}><option value="all">All</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
      <button type="button" onClick={() => void state.load(1)} disabled={state.loading}>Apply</button>
    </section>

    {state.error && <section role="alert" style={{ marginBottom: 16 }}><strong>Unable to load workflows.</strong><p>{state.error}</p><button type="button" onClick={() => void state.load(state.page)}>Retry</button></section>}
    {state.loading && <p role="status" aria-live="polite">Loading workflows…</p>}

    {!state.loading && !state.error && state.items.length === 0 && <section aria-live="polite"><p>No workflows found.</p>{canCreate && <button type="button" onClick={state.startCreate}>Create the first workflow</button>}</section>}

    {state.items.length > 0 && <section aria-label="Workflow results" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th scope="col">Name</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Steps</th><th scope="col">Updated</th><th scope="col"><span>Actions</span></th></tr></thead><tbody>{state.items.map(item => <WorkflowRow key={item.id} item={item} canEdit={canEdit} canDelete={canDelete} deleting={state.deletingId === item.id} onEdit={() => state.startEdit(item)} onDelete={() => void state.remove(item.id)} />)}</tbody></table><nav aria-label="Workflow pagination" style={{ display: 'flex', gap: 12, marginTop: 16 }}><button type="button" disabled={state.loading || state.page <= 1} onClick={() => state.setPage(state.page - 1)}>Previous</button><span>Page {state.page} · {state.total} total</span><button type="button" disabled={state.loading || state.page * 10 >= state.total} onClick={() => state.setPage(state.page + 1)}>Next</button></nav></section>}

    {(canCreate || state.editingId) && <section aria-labelledby="workflow-form-title" style={{ marginTop: 32 }}><h2 id="workflow-form-title">{state.editingId ? 'Edit workflow' : 'Create workflow'}</h2>{state.formError && <p role="alert">{state.formError}</p>}<form onSubmit={e => { e.preventDefault(); void state.save(); }} noValidate style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
      <Field label="Name" error={state.validationErrors.name}><input id="workflow-name" value={state.form.name} onChange={e => updateForm('name', e.target.value)} aria-invalid={Boolean(state.validationErrors.name)} /></Field>
      <Field label="Description" error={state.validationErrors.description}><textarea id="workflow-description" value={state.form.description} onChange={e => updateForm('description', e.target.value)} aria-invalid={Boolean(state.validationErrors.description)} /></Field>
      <Field label="Owner" error={state.validationErrors.owner}><input id="workflow-owner" value={state.form.owner} onChange={e => updateForm('owner', e.target.value)} aria-invalid={Boolean(state.validationErrors.owner)} /></Field>
      <Field label="Status"><select value={state.form.status} onChange={e => updateForm('status', e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Steps" error={state.validationErrors.steps}><input type="number" min="1" step="1" value={state.form.steps} onChange={onNumber} aria-invalid={Boolean(state.validationErrors.steps)} /></Field>
      <div style={{ display: 'flex', gap: 8 }}><button type="submit" disabled={state.saving}>{state.saving ? 'Saving…' : state.editingId ? 'Save changes' : 'Create workflow'}</button><button type="button" onClick={state.startCreate} disabled={state.saving}>Reset</button></div>
    </form></section>}
  </main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label style={{ display: 'grid', gap: 4 }}>{label}{children}{error && <span role="alert">{error}</span>}</label>; }
function WorkflowRow({ item, canEdit, canDelete, deleting, onEdit, onDelete }: { item: Workflow; canEdit: boolean; canDelete: boolean; deleting: boolean; onEdit: () => void; onDelete: () => void }) { return <tr><td>{item.name}</td><td>{item.owner}</td><td>{item.status}</td><td>{item.steps}</td><td>{item.updatedAt}</td><td><div style={{ display: 'flex', gap: 8 }}>{canEdit && <button type="button" onClick={onEdit}>Edit</button>}{canDelete && <button type="button" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>}</div></td></tr>; }
