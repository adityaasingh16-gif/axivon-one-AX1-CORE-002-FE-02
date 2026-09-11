import { BaseEntity } from './common.types.js';

export interface SystemSetting extends BaseEntity {
  key: string;
  value: unknown;
  category: string;
  isEncrypted: boolean;
}
