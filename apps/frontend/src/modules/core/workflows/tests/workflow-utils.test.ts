import { describe, expect, it } from 'vitest';
import { hasValidationErrors, validateWorkflow } from '../workflow-utils';

describe('workflow validation', () => {
  it('rejects missing required fields', () => {
    const errors = validateWorkflow({ name: '', description: '', owner: '', status: 'draft', steps: 0 });
    expect(hasValidationErrors(errors)).toBe(true);
    expect(errors.name).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.owner).toBeTruthy();
    expect(errors.steps).toBeTruthy();
  });

  it('accepts a valid workflow', () => {
    expect(validateWorkflow({ name: 'Daily Approval', description: 'Approvals for daily work.', owner: 'Operations', status: 'active', steps: 3 })).toEqual({});
  });
});
