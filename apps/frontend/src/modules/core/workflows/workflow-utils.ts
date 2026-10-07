import type { WorkflowFormValues } from './contracts';

export interface WorkflowValidationErrors {
  name?: string;
  description?: string;
  owner?: string;
  steps?: string;
}

export function validateWorkflow(values: WorkflowFormValues): WorkflowValidationErrors {
  const errors: WorkflowValidationErrors = {};
  if (!values.name.trim()) errors.name = 'Workflow name is required.';
  else if (values.name.trim().length < 3) errors.name = 'Workflow name must be at least 3 characters.';
  if (!values.description.trim()) errors.description = 'Description is required.';
  if (!values.owner.trim()) errors.owner = 'Owner is required.';
  if (!Number.isInteger(values.steps) || values.steps < 1) errors.steps = 'Steps must be a whole number greater than 0.';
  return errors;
}

export function hasValidationErrors(errors: WorkflowValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
