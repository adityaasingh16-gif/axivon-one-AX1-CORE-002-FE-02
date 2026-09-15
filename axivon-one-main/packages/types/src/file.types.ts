import { BaseEntity, UUID } from './common.types.js';

export interface FileMetadata extends BaseEntity {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadedBy: UUID;
  organizationId?: UUID;
}
