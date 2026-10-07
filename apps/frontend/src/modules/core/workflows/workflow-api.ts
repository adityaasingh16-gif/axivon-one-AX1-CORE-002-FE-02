import type { WorkflowApi, WorkflowFormValues, WorkflowListQuery, WorkflowListResponse, Workflow } from './contracts';

/**
 * Adapter for an approved backend client. This module deliberately does not
 * invent endpoint paths; the application supplies the approved request functions.
 */
export interface WorkflowRequestClient {
  list(query: WorkflowListQuery, signal?: AbortSignal): Promise<WorkflowListResponse>;
  create(values: WorkflowFormValues, signal?: AbortSignal): Promise<Workflow>;
  update(id: string, values: WorkflowFormValues, signal?: AbortSignal): Promise<Workflow>;
  remove(id: string, signal?: AbortSignal): Promise<void>;
}

export function createWorkflowApi(client: WorkflowRequestClient): WorkflowApi {
  return {
    list: client.list,
    create: client.create,
    update: client.update,
    remove: client.remove,
  };
}
