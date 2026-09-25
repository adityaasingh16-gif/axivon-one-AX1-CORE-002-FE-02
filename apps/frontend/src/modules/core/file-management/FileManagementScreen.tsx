import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { FileApi, FileKind, FileMetadata } from './index';
import { fileIcon, formatFileSize } from './index';
import './file-management.css';

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

interface FileActionProps {
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

function FileActions({ onPreview, onDownload, onRename, onDelete, disabled = false }: FileActionProps) {
  return <div className="file-actions" aria-label="File actions">
    <button type="button" onClick={onPreview} disabled={disabled}>Preview</button>
    <button type="button" onClick={onDownload} disabled={disabled}>Download</button>
    <button type="button" onClick={onRename} disabled={disabled}>Rename</button>
    <button type="button" onClick={onDelete} disabled={disabled}>Delete</button>
  </div>;
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
    <input ref={inputRef} type="file" multiple hidden onChange={onChange} disabled={disabled} aria-label="Choose files to upload" />
    <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>
      {disabled ? 'Uploading…' : 'Choose files'}
    </button>
  </section>;
}

export function FileCard({ file, onPreview, onDownload, onRename, onDelete, disabled = false }: { file: FileMetadata } & FileActionProps) {
  return <article className="file-card" aria-label={`File ${file.name}`}>
    <div className="file-icon" aria-hidden="true">{fileIcon(file.kind)}</div>
    <h3 title={file.name}>{file.name}</h3>
    <p>{formatFileSize(file.size)} · {file.mimeType}</p>
    <p>Updated {new Date(file.updatedAt).toLocaleDateString()}</p>
    <FileActions onPreview={onPreview} onDownload={onDownload} onRename={onRename} onDelete={onDelete} disabled={disabled} />
  </article>;
}

export function FilePreviewPanel({ file, previewUrl, onClose }: { file: FileMetadata; previewUrl?: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return <div className="file-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" aria-describedby="preview-description">
    <div ref={dialogRef} className="file-dialog" tabIndex={-1}>
      <header><h2 id="preview-title">{file.name}</h2><button type="button" onClick={onClose}>Close</button></header>
      <p id="preview-description" className="sr-only">File preview dialog. Press Escape to close.</p>
      {previewUrl && file.kind === 'image'
        ? <img src={previewUrl} alt={file.name} className="file-preview-image" />
        : <p>Preview is available when the configured file service returns a preview resource.</p>}
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
  const filesRef = useRef(files);
  const previewRequestRef = useRef(0);
  const previewObjectUrlRef = useRef<string | null>(null);

  filesRef.current = files;

  const filteredFiles = useMemo(() => files.filter((file) => {
    const text = query.trim().toLowerCase();
    return (!text || file.name.toLowerCase().includes(text) || file.mimeType.toLowerCase().includes(text)) &&
      (filter === 'all' || file.kind === filter);
  }), [files, query, filter]);

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  const upload = async (selectedFiles: File[]) => {
    if (!api) return;
    setBusy(true);
    setActionError(null);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => api.upload(file)));
      onFilesChanged?.([...filesRef.current, ...uploaded]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const preview = async (file: FileMetadata) => {
    const requestId = ++previewRequestRef.current;
    clearPreviewObjectUrl();
    setSelected(file);
    setPreviewUrl(undefined);
    setActionError(null);
    if (!api) return;

    try {
      const url = await api.preview(file);
      if (requestId !== previewRequestRef.current) return;
      if (url && url.startsWith('blob:')) previewObjectUrlRef.current = url;
      setPreviewUrl(url);
    } catch (cause) {
      if (requestId !== previewRequestRef.current) return;
      setActionError(cause instanceof Error ? cause.message : 'Preview failed.');
    }
  };

  const closePreview = () => {
    ++previewRequestRef.current;
    clearPreviewObjectUrl();
    setSelected(null);
    setPreviewUrl(undefined);
  };

  const download = async (file: FileMetadata) => {
    if (!api) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.download(file);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (file: FileMetadata) => {
    if (!api) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.remove(file.id);
      const nextFiles = filesRef.current.filter((item) => item.id !== file.id);
      filesRef.current = nextFiles;
      onFilesChanged?.(nextFiles);
      if (selected?.id === file.id) closePreview();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  const rename = async () => {
    if (!api || !renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      setActionError('File name cannot be empty.');
      return;
    }

    setBusy(true);
    setActionError(null);
    try {
      const updated = await api.rename(renameTarget.id, name);
      const nextFiles = filesRef.current.map((item) => item.id === updated.id ? updated : item);
      filesRef.current = nextFiles;
      onFilesChanged?.(nextFiles);
      setRenameTarget(null);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Rename failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => clearPreviewObjectUrl(), []);

  return <main className="file-management" aria-busy={loading || busy}>
    <header className="file-header">
      <div>
        <h1>File Management</h1>
        <p>Upload, browse, preview, download and manage stored files.</p>
      </div>
    </header>

    <FileUploadPanel onUpload={(selectedFiles) => void upload(selectedFiles)} disabled={!api || busy} />

    {error && <div role="alert" className="file-error">{error}{onRetry && <button type="button" onClick={onRetry} disabled={busy}>Retry</button>}</div>}
    {actionError && <div role="alert" className="file-error">{actionError}</div>}

    <section className="file-toolbar" aria-label="File controls">
      <label className="file-search">
        <span>Search files</span>
        <input aria-label="Search files" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files…" />
      </label>
      <label>
        <span>File type</span>
        <select aria-label="Filter files" value={filter} onChange={(event) => setFilter(event.target.value as FileFilter)} disabled={busy}>
          <option value="all">All types</option>
          <option value="document">Documents</option><option value="image">Images</option><option value="video">Videos</option>
          <option value="audio">Audio</option><option value="archive">Archives</option><option value="other">Other</option>
        </select>
      </label>
      <div className="view-controls" aria-label="View mode">
        <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} disabled={busy}>Grid</button>
        <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} disabled={busy}>List</button>
      </div>
    </section>

    {loading
      ? <div role="status" className="file-empty">Loading files…</div>
      : filteredFiles.length === 0
        ? <div role="status" className="file-empty"><strong>No files found</strong><p>{query || filter !== 'all' ? 'Try changing your search or filter.' : 'Upload a file to get started.'}</p></div>
        : view === 'grid'
          ? <section className="file-grid" aria-label="File grid">
              {filteredFiles.map((file) => <FileCard key={file.id} file={file} disabled={busy}
                onPreview={() => void preview(file)}
                onDownload={() => void download(file)}
                onRename={() => { setRenameTarget(file); setRenameValue(file.name); }}
                onDelete={() => void remove(file)} />)}
            </section>
          : <section className="file-panel" aria-label="File list">
              <table>
                <caption className="sr-only">Stored files</caption>
                <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Size</th><th scope="col">Updated</th><th scope="col">Actions</th></tr></thead>
                <tbody>{filteredFiles.map((file) => <tr key={file.id}>
                  <td>{file.name}</td><td>{file.kind}</td><td>{formatFileSize(file.size)}</td><td>{new Date(file.updatedAt).toLocaleDateString()}</td>
                  <td><FileActions disabled={busy} onPreview={() => void preview(file)} onDownload={() => void download(file)}
                    onRename={() => { setRenameTarget(file); setRenameValue(file.name); }} onDelete={() => void remove(file)} /></td>
                </tr>)}</tbody>
              </table>
            </section>}

    {selected && <FilePreviewPanel file={selected} previewUrl={previewUrl} onClose={closePreview} />}

    {renameTarget && <div className="file-modal" role="dialog" aria-modal="true" aria-labelledby="rename-title" aria-describedby="rename-description">
      <div className="file-dialog" tabIndex={-1}>
        <h2 id="rename-title">Rename file</h2>
        <p id="rename-description">Enter a new name for {renameTarget.name}.</p>
        <label>
          <span>New file name</span>
          <input aria-label="New file name" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setRenameTarget(null); }} disabled={busy} />
        </label>
        <div className="file-actions">
          <button type="button" onClick={() => setRenameTarget(null)} disabled={busy}>Cancel</button>
          <button type="button" onClick={() => void rename()} disabled={busy || !renameValue.trim()}>Save name</button>
        </div>
      </div>
    </div>}
  </main>;
}
