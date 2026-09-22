import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import type { FileApi, FileKind, FileMetadata } from './index';
import { fileIcon, formatFileSize } from './index';

type ViewMode = 'grid' | 'list';
type FileFilter = 'all' | FileKind;

export interface FileManagementScreenProps {
  files: FileMetadata[];
  api?: FileApi;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onFilesChanged?: (files: FileMetadata[]) => void;
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100%', padding: 24, background: '#f7f8fa', color: '#172033', fontFamily: 'Inter, system-ui, sans-serif' },
  shell: { maxWidth: 1180, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 28, lineHeight: 1.2 },
  subtitle: { margin: '6px 0 0', color: '#667085', fontSize: 14 },
  primary: { border: 0, borderRadius: 10, padding: '10px 16px', background: '#172033', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  search: { flex: '1 1 280px', minWidth: 220, border: '1px solid #d0d5dd', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' },
  select: { border: '1px solid #d0d5dd', borderRadius: 10, padding: '10px 12px', background: '#fff', color: '#344054' },
  toggle: { display: 'inline-flex', border: '1px solid #d0d5dd', borderRadius: 10, overflow: 'hidden', background: '#fff' },
  toggleButton: { border: 0, padding: '9px 12px', background: '#fff', cursor: 'pointer' },
  panel: { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 16, marginBottom: 16 },
  uploadZone: { border: '1.5px dashed #98a2b3', borderRadius: 12, padding: 22, textAlign: 'center', background: '#fcfcfd' },
  dropTitle: { margin: '0 0 6px', fontSize: 16 },
  muted: { color: '#667085', fontSize: 13 },
  error: { padding: 14, borderRadius: 10, background: '#fff1f3', color: '#b42318', marginBottom: 16 },
  empty: { padding: 48, textAlign: 'center', color: '#667085', background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  card: { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 16, minWidth: 0 },
  icon: { width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#eef2f6', color: '#344054', fontSize: 10, fontWeight: 800, letterSpacing: 0.4 },
  fileName: { margin: '12px 0 4px', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { margin: 0, color: '#667085', fontSize: 12 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 },
  action: { border: '1px solid #d0d5dd', borderRadius: 8, padding: '7px 10px', background: '#fff', cursor: 'pointer', color: '#344054', fontSize: 12 },
  list: { width: '100%', borderCollapse: 'collapse' },
  row: { borderBottom: '1px solid #eaecf0' },
  cell: { padding: '12px 8px', textAlign: 'left', fontSize: 13, verticalAlign: 'middle' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(16,24,40,.45)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 10 },
  dialog: { width: 'min(720px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 16, padding: 20 },
};

export function FileUploadPanel({ onUpload, disabled }: { onUpload: (files: File[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length) onUpload(selected);
    event.target.value = '';
  };

  return (
    <section style={styles.panel} aria-labelledby="file-upload-title">
      <div style={styles.uploadZone}>
        <h2 id="file-upload-title" style={styles.dropTitle}>Upload files</h2>
        <p style={styles.muted}>Choose one or more files to add them to the current storage location.</p>
        <input ref={inputRef} type="file" multiple hidden onChange={handleChange} disabled={disabled} />
        <button type="button" style={styles.primary} onClick={() => inputRef.current?.click()} disabled={disabled}>
          {disabled ? 'Uploading…' : 'Choose files'}
        </button>
      </div>
    </section>
  );
}

export function FileCard({
  file,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}: {
  file: FileMetadata;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <article style={styles.card} aria-label={`File ${file.name}`}>
      <div style={styles.icon} aria-hidden="true">{fileIcon(file.kind)}</div>
      <h3 style={styles.fileName} title={file.name}>{file.name}</h3>
      <p style={styles.meta}>{formatFileSize(file.size)} · {file.mimeType}</p>
      <p style={styles.meta}>Updated {new Date(file.updatedAt).toLocaleDateString()}</p>
      <div style={styles.actions}>
        <button type="button" style={styles.action} onClick={onPreview}>Preview</button>
        <button type="button" style={styles.action} onClick={onDownload}>Download</button>
        <button type="button" style={styles.action} onClick={onRename}>Rename</button>
        <button type="button" style={styles.action} onClick={onDelete}>Delete</button>
      </div>
    </article>
  );
}

export function FilePreviewPanel({ file, previewUrl, onClose }: { file: FileMetadata; previewUrl?: string; onClose: () => void }) {
  return (
    <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="file-preview-title">
      <div style={styles.dialog}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h2 id="file-preview-title" style={{ margin: 0, fontSize: 20 }}>{file.name}</h2>
            <p style={styles.muted}>{formatFileSize(file.size)} · {file.mimeType}</p>
          </div>
          <button type="button" style={styles.action} onClick={onClose}>Close</button>
        </div>
        <div style={{ marginTop: 18, minHeight: 220, display: 'grid', placeItems: 'center', background: '#f7f8fa', borderRadius: 12, overflow: 'hidden' }}>
          {previewUrl && file.kind === 'image' ? <img src={previewUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }} /> : (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ ...styles.icon, margin: '0 auto 12px' }}>{fileIcon(file.kind)}</div>
              <p style={{ margin: 0, color: '#667085' }}>Preview is available when the configured file service returns a preview resource.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FileManagementScreen({ files, api, loading = false, error = null, onRetry, onFilesChanged }: FileManagementScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FileFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<FileMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileMetadata | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return files.filter((file) => {
      const matchesQuery = !normalized || file.name.toLowerCase().includes(normalized) || file.mimeType.toLowerCase().includes(normalized);
      const matchesFilter = filter === 'all' || file.kind === filter;
      return matchesQuery && matchesFilter;
    });
  }, [files, query, filter]);

  const upload = async (selectedFiles: File[]) => {
    if (!api) return;
    setBusy(true);
    setActionError(null);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => api.upload(file)));
      onFilesChanged?.([...files, ...uploaded]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const preview = async (file: FileMetadata) => {
    setSelected(file);
    if (!api) return;
    setActionError(null);
    try {
      setPreviewUrl(await api.preview(file));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Preview failed.');
    }
  };

  const download = async (file: FileMetadata) => {
    if (!api) return;
    setActionError(null);
    try { await api.download(file); } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Download failed.'); }
  };

  const remove = async (file: FileMetadata) => {
    if (!api) return;
    setActionError(null);
    try {
      await api.remove(file.id);
      onFilesChanged?.(files.filter((item) => item.id !== file.id));
      if (selected?.id === file.id) setSelected(null);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Delete failed.'); }
  };

  const rename = async () => {
    if (!api || !renameTarget) return;
    const name = renameValue.trim();
    if (!name) { setActionError('File name cannot be empty.'); return; }
    setActionError(null);
    try {
      const updated = await api.rename(renameTarget.id, name);
      onFilesChanged?.(files.map((item) => item.id === updated.id ? updated : item));
      setRenameTarget(null);
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Rename failed.'); }
  };

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div><h1 style={styles.title}>File Management</h1><p style={styles.subtitle}>Upload, browse, preview, download and manage stored files.</p></div>
        </header>

        <FileUploadPanel onUpload={(selectedFiles) => void upload(selectedFiles)} disabled={!api || busy} />

        {error && <div role="alert" style={styles.error}>{error}{onRetry && <button type="button" style={{ ...styles.action, marginLeft: 10 }} onClick={onRetry}>Retry</button>}</div>}
        {actionError && <div role="alert" style={styles.error}>{actionError}</div>}

        <section style={styles.toolbar} aria-label="File controls">
          <input aria-label="Search files" style={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files…" />
          <select aria-label="Filter files" style={styles.select} value={filter} onChange={(event) => setFilter(event.target.value as FileFilter)}>
            <option value="all">All types</option><option value="document">Documents</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="archive">Archives</option><option value="other">Other</option>
          </select>
          <div style={styles.toggle} aria-label="View mode">
            <button type="button" style={{ ...styles.toggleButton, fontWeight: view === 'grid' ? 700 : 400 }} onClick={() => setView('grid')} aria-pressed={view === 'grid'}>Grid</button>
            <button type="button" style={{ ...styles.toggleButton, fontWeight: view === 'list' ? 700 : 400 }} onClick={() => setView('list')} aria-pressed={view === 'list'}>List</button>
          </div>
        </section>

        {loading ? <div role="status" style={styles.empty}>Loading files…</div> : filteredFiles.length === 0 ? (
          <div role="status" style={styles.empty}><strong>No files found</strong><div style={{ marginTop: 6 }}>{query || filter !== 'all' ? 'Try changing your search or filter.' : 'Upload a file to get started.'}</div></div>
        ) : view === 'grid' ? (
          <section style={styles.grid} aria-label="File grid">
            {filteredFiles.map((file) => <FileCard key={file.id} file={file} onPreview={() => void preview(file)} onDownload={() => void download(file)} onRename={() => { setRenameTarget(file); setRenameValue(file.name); }} onDelete={() => void remove(file)} />)}
          </section>
        ) : (
          <div style={styles.panel} style={styles.panel}>
            <table style={styles.list}><thead><tr style={styles.row}><th style={styles.cell}>Name</th><th style={styles.cell}>Type</th><th style={styles.cell}>Size</th><th style={styles.cell}>Updated</th><th style={styles.cell}>Actions</th></tr></thead><tbody>
              {filteredFiles.map((file) => <tr key={file.id} style={styles.row}><td style={styles.cell}><strong>{file.name}</strong></td><td style={styles.cell}>{file.kind}</td><td style={styles.cell}>{formatFileSize(file.size)}</td><td style={styles.cell}>{new Date(file.updatedAt).toLocaleDateString()}</td><td style={styles.cell}><div style={styles.actions}><button type="button" style={styles.action} onClick={() => void preview(file)}>Preview</button><button type="button" style={styles.action} onClick={() => void download(file)}>Download</button><button type="button" style={styles.action} onClick={() => { setRenameTarget(file); setRenameValue(file.name); }}>Rename</button><button type="button" style={styles.action} onClick={() => void remove(file)}>Delete</button></div></td></tr>)}
            </tbody></table>
          </div>
        )}
      </div>

      {selected && <FilePreviewPanel file={selected} previewUrl={previewUrl} onClose={() => { setSelected(null); setPreviewUrl(undefined); }} />}
      {renameTarget && <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="rename-title"><div style={styles.dialog}><h2 id="rename-title" style={{ marginTop: 0 }}>Rename file</h2><input aria-label="New file name" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} style={{ ...styles.search, width: '100%', boxSizing: 'border-box' }} /><div style={{ ...styles.actions, justifyContent: 'flex-end' }}><button type="button" style={styles.action} onClick={() => setRenameTarget(null)}>Cancel</button><button type="button" style={styles.primary} onClick={() => void rename()} disabled={busy}>Save name</button></div></div></div>}
    </main>
  );
}
