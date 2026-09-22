import type { FileUploadProgress } from '../modules/core/file-management/index.js';

export interface FileDropzoneOptions {
  accept?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
}

/** Framework-agnostic dropzone controller for React or other UI layers. */
export class FileDropzoneController {
  constructor(private readonly options: FileDropzoneOptions) {}

  handleFiles(input: FileList | File[]): File[] {
    const files = Array.from(input);
    const valid: File[] = [];
    for (const file of files) {
      if (this.options.maxSizeBytes && file.size > this.options.maxSizeBytes) {
        this.options.onError?.(`${file.name} exceeds the maximum file size.`);
        continue;
      }
      if (this.options.accept && !this.matchesAccept(file)) {
        this.options.onError?.(`${file.name} is not an accepted file type.`);
        continue;
      }
      valid.push(file);
      if (!this.options.multiple) break;
    }
    if (valid.length) this.options.onFiles(valid);
    return valid;
  }

  private matchesAccept(file: File): boolean {
    return this.options.accept!.split(',').some((rule) => {
      const value = rule.trim().toLowerCase();
      if (value === '*/*') return true;
      if (value.endsWith('/*')) return file.type.startsWith(value.slice(0, -1));
      if (value.startsWith('.')) return file.name.toLowerCase().endsWith(value);
      return file.type.toLowerCase() === value;
    });
  }
}

export const createUploadState = (file: File): FileUploadProgress => ({
  file,
  progress: 0,
  status: 'queued',
});
