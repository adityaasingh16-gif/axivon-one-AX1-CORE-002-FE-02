export type FileKind = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  kind: FileKind;
  storageKey?: string;
  uploadedAt: string;
  updatedAt: string;
  ownerId?: string;
  folderId?: string;
  downloadUrl?: string;
}

export interface FileListResponse { items: FileMetadata[]; total: number; }
export interface FileUploadProgress { file: File; progress: number; status: 'queued' | 'uploading' | 'success' | 'error'; error?: string; }

export interface FileApi {
  list(folderId?: string): Promise<FileListResponse>;
  upload(file: File, folderId?: string, onProgress?: (progress: number) => void): Promise<FileMetadata>;
  preview(file: FileMetadata): Promise<string>;
  download(file: FileMetadata): Promise<void>;
  rename(fileId: string, name: string): Promise<FileMetadata>;
  remove(fileId: string): Promise<void>;
}

const kindFromMime = (mimeType: string): FileKind => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  return 'other';
};

const toMetadata = (file: File, folderId?: string): FileMetadata => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream', kind: kindFromMime(file.type || ''), uploadedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), folderId });

export class FileService implements FileApi {
  private readonly baseUrl: string;
  constructor(baseUrl = '') { this.baseUrl = baseUrl.replace(/\/$/, ''); }
  async list(folderId?: string): Promise<FileListResponse> { if (!this.baseUrl) return { items: [], total: 0 }; const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''; const response = await fetch(`${this.baseUrl}/files${query}`, { credentials: 'include' }); if (!response.ok) throw new Error(`Unable to load files (${response.status})`); return response.json() as Promise<FileListResponse>; }
  async upload(file: File, folderId?: string, onProgress?: (progress: number) => void): Promise<FileMetadata> { if (!this.baseUrl) { onProgress?.(100); return toMetadata(file, folderId); } const body = new FormData(); body.append('file', file); if (folderId) body.append('folderId', folderId); const response = await fetch(`${this.baseUrl}/files`, { method: 'POST', body, credentials: 'include' }); if (!response.ok) throw new Error(`Upload failed (${response.status})`); onProgress?.(100); return response.json() as Promise<FileMetadata>; }
  async preview(file: FileMetadata): Promise<string> { if (file.downloadUrl) return file.downloadUrl; if (!this.baseUrl) return ''; const response = await fetch(`${this.baseUrl}/files/${encodeURIComponent(file.id)}/preview`, { credentials: 'include' }); if (!response.ok) throw new Error(`Preview failed (${response.status})`); return URL.createObjectURL(await response.blob()); }
  async download(file: FileMetadata): Promise<void> { const url = file.downloadUrl || (this.baseUrl ? `${this.baseUrl}/files/${encodeURIComponent(file.id)}/download` : ''); if (!url) throw new Error('No download URL is available for this file.'); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.target = '_blank'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); }
  async rename(fileId: string, name: string): Promise<FileMetadata> { const safeName = name.trim(); if (!safeName) throw new Error('File name cannot be empty.'); if (!this.baseUrl) throw new Error('Rename requires the configured file API.'); const response = await fetch(`${this.baseUrl}/files/${encodeURIComponent(fileId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: safeName }) }); if (!response.ok) throw new Error(`Rename failed (${response.status})`); return response.json() as Promise<FileMetadata>; }
  async remove(fileId: string): Promise<void> { if (!this.baseUrl) throw new Error('Delete requires the configured file API.'); const response = await fetch(`${this.baseUrl}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE', credentials: 'include' }); if (!response.ok) throw new Error(`Delete failed (${response.status})`); }
}

export const formatFileSize = (bytes: number): string => { if (bytes < 1024) return `${bytes} B`; const units = ['KB', 'MB', 'GB', 'TB']; let value = bytes / 1024; let index = 0; while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; } return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`; };
export const fileIcon = (kind: FileKind): string => ({ document: 'DOC', image: 'IMG', video: 'VID', audio: 'AUD', archive: 'ZIP', other: 'FILE' }[kind]);
