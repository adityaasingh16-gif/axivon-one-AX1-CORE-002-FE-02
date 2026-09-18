import { describe, expect, it } from 'vitest';
import { validateSettings } from '../src/utils/settingsValidation';

describe('settings validation', () => {
  it('requires valid profile fields', () => {
    expect(validateSettings('profile', { name: '', email: 'bad' })).toEqual({
      name: 'Full name is required.',
      email: 'Enter a valid email address.'
    });
  });

  it('accepts a valid organization', () => {
    expect(validateSettings('organization', {
      name: 'Axivon Technologies', slug: 'axivon-technologies',
      primaryDomain: 'example.com', logoUrl: 'https://example.com/logo.png',
      supportEmail: 'support@example.com', billingEmail: 'billing@example.com'
    })).toEqual({});
  });

  it('rejects invalid organization values', () => {
    const errors = validateSettings('organization', {
      name: 'Org', slug: 'Bad Slug', primaryDomain: 'not-a-domain',
      logoUrl: 'javascript:alert(1)', supportEmail: 'bad', billingEmail: 'bad'
    });
    expect(Object.keys(errors)).toEqual(['slug', 'primaryDomain', 'logoUrl', 'supportEmail', 'billingEmail']);
  });

  it('enforces the security timeout range', () => {
    expect(validateSettings('security', { sessionTimeout: 4 }).sessionTimeout).toBeTruthy();
    expect(validateSettings('security', { sessionTimeout: 1441 }).sessionTimeout).toBeTruthy();
    expect(validateSettings('security', { sessionTimeout: 30 })).toEqual({});
  });
});
