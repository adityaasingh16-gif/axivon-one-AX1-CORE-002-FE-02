import type { UserProfileDraft } from '../types.js';
import { hasValidationErrors, validateUserProfile } from '../validation.js';

export interface UserFormResult {
  valid: boolean;
  errors: ReturnType<typeof validateUserProfile>;
  value: UserProfileDraft;
}

/** Framework-neutral form controller so the UI layer can bind it to React/Vue/etc. */
export const validateUserForm = (value: UserProfileDraft): UserFormResult => {
  const errors = validateUserProfile(value);
  return { valid: !hasValidationErrors(errors), errors, value };
};
