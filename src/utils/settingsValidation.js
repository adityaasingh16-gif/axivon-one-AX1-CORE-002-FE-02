const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export const validateEmail = (value) => EMAIL_RE.test(String(value || '').trim());
export const validateSlug = (value) => SLUG_RE.test(String(value || '').trim());
export const validateDomain = (value) => !String(value || '').trim() || DOMAIN_RE.test(String(value).trim());
export const validateUrl = (value) => {
  if (!String(value || '').trim()) return true;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateSettings = (section, values) => {
  const errors = {};

  if (section === 'profile') {
    if (!String(values.name || '').trim()) errors.name = 'Full name is required.';
    if (!validateEmail(values.email)) errors.email = 'Enter a valid email address.';
  }

  if (section === 'organization') {
    if (!String(values.name || '').trim()) errors.name = 'Organization name is required.';
    if (!validateSlug(values.slug)) errors.slug = 'Use lowercase letters, numbers and single hyphens.';
    if (!validateDomain(values.primaryDomain)) errors.primaryDomain = 'Enter a valid domain, such as example.com.';
    if (!validateUrl(values.logoUrl)) errors.logoUrl = 'Logo URL must start with http:// or https://.';
    if (values.supportEmail && !validateEmail(values.supportEmail)) errors.supportEmail = 'Enter a valid support email.';
    if (values.billingEmail && !validateEmail(values.billingEmail)) errors.billingEmail = 'Enter a valid billing email.';
  }

  if (section === 'security') {
    const timeout = Number(values.sessionTimeout);
    if (!Number.isInteger(timeout) || timeout < 5 || timeout > 1440) {
      errors.sessionTimeout = 'Session timeout must be a whole number from 5 to 1440 minutes.';
    }
  }

  return errors;
};
