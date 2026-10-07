export type WorkflowStatus = 'draft' | 'active' | 'paused';
export type WorkflowPermission = 'view' | 'create' | 'edit' | 'delete';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: WorkflowStatus;
  updatedAt: string;
  steps: number;
}

export interface WorkflowFormValues {
  name: string;
  description: string;
  owner: string;
  status: WorkflowStatus;
  steps: number;
}

export interface WorkflowListQuery {
  search?: string;
  status?: WorkflowStatus | 'all';
  page?: number;
  pageSize?: number;
}

export interface WorkflowListResponse {
  data: Workflow[];
  meta: { page: number; pageSize: number; total: number };
}

export interface WorkflowApi {
  list(query: WorkflowListQuery, signal?: AbortSignal): Promise<WorkflowListResponse>;
  create(values: WorkflowFormValues, signal?: AbortSignal): Promise<Workflow>;
  update(id: string, values: WorkflowFormValues, signal?: AbortSignal): Promise<Workflow>;
  remove(id: string, signal?: AbortSignal): Promise<void>;
}

export interface WorkflowPermissions {
  can(permission: WorkflowPermission): boolean;
}
