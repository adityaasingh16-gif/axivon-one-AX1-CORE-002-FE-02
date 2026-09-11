/**
 * AXIVON ONE — CORE-001 Authentication primary UI.
 *
 * FE-02 is presentation-only. API calls, validation, routing and session
 * state transitions remain owned by the subsequent frontend tasks.
 */

export type AuthScreen =
  | 'login'
  | 'register'
  | 'verify'
  | 'forgot-password'
  | 'reset-password'
  | 'logout'
  | 'session-expired';

export interface AuthField {
  id: string;
  label: string;
  type?: 'email' | 'password' | 'text' | 'tel';
  placeholder?: string;
  autocomplete?: HTMLInputElement['autocomplete'];
  required?: boolean;
}

export interface AuthScreenConfig {
  screen: AuthScreen;
  title: string;
  description: string;
  fields: AuthField[];
  primaryLabel: string;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  onSubmit?: (form: HTMLFormElement) => void;
}

export interface AuthUIOptions {
  brandName?: string;
  supportText?: string;
}

const DEFAULT_BRAND = 'AXIVON ONE';
const DEFAULT_SUPPORT = 'Secure access to your workspace';

const SCREEN_CONFIG: Record<AuthScreen, Omit<AuthScreenConfig, 'screen'>> = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to continue to your workspace.',
    fields: [
      { id: 'email', label: 'Work email', type: 'email', placeholder: 'you@company.com', autocomplete: 'email', required: true },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password', autocomplete: 'current-password', required: true },
    ],
    primaryLabel: 'Sign in',
    secondaryLabel: 'Create an account',
  },
  register: {
    title: 'Create your account',
    description: 'Set up your account to get started with AXIVON ONE.',
    fields: [
      { id: 'firstName', label: 'First name', type: 'text', placeholder: 'First name', autocomplete: 'given-name', required: true },
      { id: 'lastName', label: 'Last name', type: 'text', placeholder: 'Last name', autocomplete: 'family-name', required: true },
      { id: 'email', label: 'Work email', type: 'email', placeholder: 'you@company.com', autocomplete: 'email', required: true },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Create a password', autocomplete: 'new-password', required: true },
      { id: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Re-enter your password', autocomplete: 'new-password', required: true },
    ],
    primaryLabel: 'Create account',
    secondaryLabel: 'Already have an account? Sign in',
  },
  verify: {
    title: 'Verify your account',
    description: 'Enter the verification code sent to your email address.',
    fields: [
      { id: 'code', label: 'Verification code', type: 'text', placeholder: 'Enter verification code', autocomplete: 'one-time-code', required: true },
    ],
    primaryLabel: 'Verify account',
    secondaryLabel: 'Back to sign in',
  },
  'forgot-password': {
    title: 'Reset your password',
    description: 'Enter your email and we will send instructions to reset your password.',
    fields: [
      { id: 'email', label: 'Work email', type: 'email', placeholder: 'you@company.com', autocomplete: 'email', required: true },
    ],
    primaryLabel: 'Send reset link',
    secondaryLabel: 'Back to sign in',
  },
  'reset-password': {
    title: 'Choose a new password',
    description: 'Create a new password for your AXIVON ONE account.',
    fields: [
      { id: 'password', label: 'New password', type: 'password', placeholder: 'Enter new password', autocomplete: 'new-password', required: true },
      { id: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Re-enter new password', autocomplete: 'new-password', required: true },
    ],
    primaryLabel: 'Update password',
    secondaryLabel: 'Back to sign in',
  },
  logout: {
    title: 'Sign out',
    description: 'You are about to sign out of AXIVON ONE on this device.',
    fields: [],
    primaryLabel: 'Sign out',
    secondaryLabel: 'Stay signed in',
  },
  'session-expired': {
    title: 'Your session has expired',
    description: 'For your security, please sign in again to continue.',
    fields: [],
    primaryLabel: 'Sign in again',
  },
};

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
};

const createLogo = (brandName: string): HTMLElement => {
  const logo = createElement('div', 'ax-auth__logo');
  logo.setAttribute('aria-label', brandName);
  logo.textContent = 'A';
  return logo;
};

const createField = (field: AuthField): HTMLElement => {
  const wrapper = createElement('div', 'ax-auth__field');
  const label = createElement('label', 'ax-auth__label');
  label.htmlFor = field.id;
  label.textContent = field.label;

  const input = createElement('input', 'ax-auth__input');
  input.id = field.id;
  input.name = field.id;
  input.type = field.type ?? 'text';
  input.placeholder = field.placeholder ?? '';
  input.autocomplete = field.autocomplete ?? 'off';
  input.required = field.required ?? false;

  wrapper.append(label, input);
  return wrapper;
};

const createButton = (
  label: string,
  variant: 'primary' | 'secondary',
  type: 'button' | 'submit',
): HTMLButtonElement => {
  const button = createElement('button', `ax-auth__button ax-auth__button--${variant}`);
  button.type = type;
  button.textContent = label;
  return button;
};

/**
 * Renders a primary authentication screen into the supplied container.
 * The function intentionally does not implement API calls, validation,
 * routing or session transitions; those belong to FE-03/FE-04 and FE-01.
 */
export const renderAuthScreen = (
  container: HTMLElement,
  config: AuthScreenConfig,
  options: AuthUIOptions = {},
): void => {
  const brandName = options.brandName ?? DEFAULT_BRAND;
  const supportText = options.supportText ?? DEFAULT_SUPPORT;

  container.replaceChildren();
  container.classList.add('ax-auth-root');

  const page = createElement('main', 'ax-auth');
  const card = createElement('section', 'ax-auth__card');
  card.setAttribute('aria-labelledby', 'ax-auth-title');

  const header = createElement('header', 'ax-auth__header');
  header.append(createLogo(brandName));

  const brand = createElement('div', 'ax-auth__brand');
  brand.textContent = brandName;
  header.append(brand);

  const title = createElement('h1', 'ax-auth__title');
  title.id = 'ax-auth-title';
  title.textContent = config.title;

  const description = createElement('p', 'ax-auth__description');
  description.textContent = config.description;

  const form = createElement('form', 'ax-auth__form');
  form.noValidate = true;

  for (const field of config.fields) {
    form.append(createField(field));
  }

  const actions = createElement('div', 'ax-auth__actions');
  actions.append(createButton(config.primaryLabel, 'primary', 'submit'));

  if (config.secondaryLabel) {
    const secondary = createButton(config.secondaryLabel, 'secondary', 'button');
    if (config.secondaryAction) secondary.addEventListener('click', config.secondaryAction);
    actions.append(secondary);
  }

  if (config.screen === 'login') {
    const recovery = createElement('button', 'ax-auth__link');
    recovery.type = 'button';
    recovery.textContent = 'Forgot your password?';
    actions.append(recovery);
  }

  if (config.onSubmit) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      config.onSubmit?.(form);
    });
  }

  const footer = createElement('footer', 'ax-auth__footer');
  footer.textContent = supportText;

  card.append(header, title, description, form, actions, footer);
  page.append(card);
  container.append(page);
};

export const getAuthScreenConfig = (screen: AuthScreen): AuthScreenConfig => ({
  screen,
  ...SCREEN_CONFIG[screen],
});
