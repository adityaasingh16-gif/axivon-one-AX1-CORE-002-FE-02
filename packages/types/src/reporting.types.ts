import { BaseEntity } from './common.types.js';

export interface ReportDefinition extends BaseEntity {
  title: string;
  description?: string;
  queryConfig: Record<string, unknown>;
  outputFormat: 'csv' | 'json' | 'pdf';
}
