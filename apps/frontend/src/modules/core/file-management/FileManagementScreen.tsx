import { useMemo, useRef, useState, type ChangeEvent } from 'react';
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

export function FileUploadPanel({ onUpload, disabled = false }: { onUpload: (files: File[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > 0) onUpload(selected);
    event.target.value = '';
  };
  return <section aria-labelledby="upload-title" className="file-panel">
    <h2 id="upload-title">Upload files</h2>
    <p>Choose one or more files to add to the current storage location.</p>
    <input ref={inputRef} type="file" multiple hidden onChange={onChange} disabled={disabled} />
    <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>{disabled ? 'Uploading…' : 'Choose files'}</button>
  </section>;
}

export function FileCard({ file, onPreview, onDownload, onRename, onDelete }: { file: FileMetadata; onPreview: () => void; onDownload: () => void; onRename: () => void; onDelete: () => void }) {
  return <article className="file-card" aria-label={`File ${file.name}`}>
    <div className="file-icon" aria-hidden="true">{fileIcon(file.kind)}</div>
    <h3 title={file.name}>{file.name}</h3>
    <p>{formatFileSize(file.size)} · {file.mimeType}</p>
    <p>Updated {new Date(file.updatedAt).toLocaleDateString()}</p>
    <div className="file-actions">
      <button type="button" onClick={onPreview}>Preview</button>
      <button type="button" onClick={onDownload}>Download</button>
      <button type="button" onClick={onRename}>Rename</button>
      <button type="button" onClick={onDelete}>Delete</button>
    </div>
  </article>;
}

export function FilePreviewPanel({ file, previewUrl, onClose }: { file: FileMetadata; previewUrl?: string; onClose: () => void }) {
  return <div className="file-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
    <div className="file-dialog">
      <header><h2 id="preview-title">{file.name}</h2><button type="button" onClick={onClose}>Close</button></header>
      {previewUrl && file.kind === 'image' ? <img src={previewUrl} alt={file.name} className="file-preview-image" /> : <p>Preview is available when the configured file service returns a preview resource.</p>}
    </div>
  </div>;
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

  const filteredFiles = useMemo(() => files.filter((file) => {
    const text = query.trim().toLowerCase();
    return (!text || file.name.toLowerCase().includes(text) || file.mimeType.toLowerCase().includes(text)) && (filter === 'all' || file.kind === filter);
  }), [files, query, filter]);

  const upload = async (selectedFiles: File[]) => {
    if (!api) return;
    setBusy(true); setActionError(null);
    try { const uploaded = await Promise.all(selectedFiles.map((file) => api.upload(file))); onFilesChanged?.([...files, ...uploaded]); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };

  const preview = async (file: FileMetadata) => {
    setSelected(file); setPreviewUrl(undefined); setActionError(null);
    if (!api) return;
    try { setPreviewUrl(await api.preview(file)); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Preview failed.'); }
  };

  const download = async (file: FileMetadata) => {
    if (!api) return;
    try { await api.download(file); } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Download failed.'); }
  };

  const remove = async (file: FileMetadata) => {
    if (!api) return;
    try { await api.remove(file.id); onFilesChanged?.(files.filter((item) => item.id !== file.id)); if (selected?.id === file.id) setSelected(null); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Delete failed.'); }
  };

  const rename = async () => {
    if (!api || !renameTarget) return;
    const name = renameValue.trim();
    if (!name) { setActionError('File name cannot be empty.'); return; }
    try { const updated = await api.rename(renameTarget.id, name); onFilesChanged?.(files.map((item) => item.id === updated.id ? updated : item)); setRenameTarget(null); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Rename failed.'); }
  };

  return <main className="file-management">
    <header className="file-header"><div><h1>File Management</h1><p>Upload, browse, preview, download and manage stored files.</p></div></header>
    <FileUploadPanel onUpload={(selectedFiles) => void upload(selectedFiles)} disabled={!api || busy} />
    {error && <div role="alert" className="file-error">{error}{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div>}
    {actionError && <div role="alert" className="file-error">{actionError}</div>}
    <section className="file-toolbar" aria-label="File controls">
      <input aria-label="Search files" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files…" />
      <select aria-label="Filter files" value={filter} onChange={(event) => setFilter(event.target.value as FileFilter)}><option value="all">All types</option><option value="document">Documents</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="archive">Archives</option><option value="other">Other</option></select>
      <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'}>Grid</button><button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'}>List</button>
    </section>
    {loading ? <div role="status" className="file-empty">Loading files…</div> : filteredFiles.length === 0 ? <div role="status" className="file-empty"><strong>No files found</strong><p>{query || filter !== 'all' ? 'Try changing your search or filter.' : 'Upload a file to get started.'}</p></div> : view === 'grid' ? <section className="file-grid" aria-label="File grid">{filteredFiles.map((file) => <FileCard key={file.id} file={file} onPreview={() => void preview(file)} onDownload={() => void download(file)} onRename={() => { setRenameTarget(file); setRenameValue(file.name); }} onDelete={() => void remove(file)} />)}</section> : <section className="file-panel"><table><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filteredFiles.map((file) => <tr key={file.id}><td>{file.name}</td><td>{file.kind}</td><td>{formatFileSize(file.size)}</td><td>{new Date(file.updatedAt).toLocaleDateString()}</td><td><div className="file-actions"><button type="button" onClick={() => void preview(file)}>Preview</button><button type="button" onClick={() => void download(file)}>Download</button><button type="button" onClick={() => { setRenameTarget(file); setRenameValue(file.name); }}>Rename</button><button type="button" onClick={() => void remove(file)}>Delete</button></div></td></tr>)}</tbody></table></section>}
    {selected && <FilePreviewPanel file={selected} previewUrl={previewUrl} onClose={() => { setSelected(null); setPreviewUrl(undefined); }} />}
    {renameTarget && <div className="file-modal" role="dialog" aria-modal="true" aria-labelledby="rename-title"><div className="file-dialog"><h2 id="rename-title">Rename file</h2><input aria-label="New file name" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><div className="file-actions"><button type="button" onClick={() => setRenameTarget(null)}>Cancel</button><button type="button" onClick={() => void rename()} disabled={busy || !renameValue.trim()}>Save name</button></div></div></div>}
  </main>;
}
