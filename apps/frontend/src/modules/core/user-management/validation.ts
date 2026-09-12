import { isEmailValid } from '@axivon/ui';
import type { UserProfileDraft } from './types.js';

export interface UserValidationErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationId?: string;
}

export const validateUserProfile = (draft: UserProfileDraft): UserValidationErrors => {
  const errors: UserValidationErrors = {};
  const email = draft.email.trim();
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const phone = draft.phone?.trim() ?? '';

  if (!email) errors.email = 'Email is required.';
  else if (!isEmailValid(email)) errors.email = 'Enter a valid email address.';
  if (!firstName) errors.firstName = 'First name is required.';
  if (!lastName) errors.lastName = 'Last name is required.';
  if (phone && !/^[+()\-\s\d]{7,20}$/.test(phone)) errors.phone = 'Enter a valid phone number.';
  if (!draft.organizationId) errors.organizationId = 'Organization is required.';

  return errors;
};

export const hasValidationErrors = (errors: UserValidationErrors): boolean =>
  Object.keys(errors).length > 0;
