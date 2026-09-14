import { BaseEntity } from './common.types.js';

export interface DashboardWidget extends BaseEntity {
  title: string;
  type: string;
  gridConfig: { x: number; y: number; w: number; h: number };
  settings?: Record<string, unknown>;
}
