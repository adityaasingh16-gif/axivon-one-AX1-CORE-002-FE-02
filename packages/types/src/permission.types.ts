import { BaseEntity } from './common.types.js';

export interface Permission extends BaseEntity {
  name: string;
  code: string;
  module: string;
  description?: string;
}
