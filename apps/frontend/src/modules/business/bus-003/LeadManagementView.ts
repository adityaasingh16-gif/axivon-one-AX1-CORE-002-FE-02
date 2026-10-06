import { findLeadModuleNavigationItem, renderLeadModuleNavigation } from './components/module-nav.js';
import { renderLeadModuleState } from './components/module-state.js';
import type { LeadModuleState, LeadModuleViewOptions } from './types.js';
import './styles.css';

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};

const renderContent = (container: HTMLElement, activePath: string): void => {
  const panel = createElement('section');
  panel.className = 'business-module__panel';

  const eyebrow = createElement('p', 'Module foundation');
  eyebrow.className = 'business-module__eyebrow';
  panel.appendChild(eyebrow);

  const title = createElement('h2', activePath === '/leads/workspace'
    ? 'Lead workspace'
    : activePath === '/leads/activity'
      ? 'Lead activity'
      : 'Ready for Lead workflows');
  panel.appendChild(title);

  const description = createElement(
    'p',
    activePath === '/leads/workspace'
      ? 'The primary lead list, filters and forms can be mounted here without changing the module shell.'
      : activePath === '/leads/activity'
        ? 'Activity and follow-up views can be added here against the approved API contract.'
        : 'Routes, navigation, reusable structure and state handling are ready for the Lead Management workflow layer.',
  );
  panel.appendChild(description);

  if (activePath === '/leads') {
    const grid = createElement('div');
    grid.className = 'business-module__grid';

    const capabilities = [
      ['Routes', 'Overview, workspace and activity route entries.'],
      ['Navigation', 'Accessible active-page navigation with responsive behavior.'],
      ['State handling', 'Loading, empty and error/retry states are built in.'],
      ['API-ready', 'Structured for the documented /api/v1/leads contract.'],
    ];

    for (const [heading, detail] of capabilities) {
      const card = createElement('article');
      card.appendChild(createElement('strong', heading));
      card.appendChild(createElement('span', detail));
      grid.appendChild(card);
    }

    panel.appendChild(grid);
  }

  container.appendChild(panel);
};

export class LeadManagementView {
  private readonly container: HTMLElement;
  private state: LeadModuleState;
  private activePath: string;
  private errorMessage: string | undefined;
  private readonly onRetry: (() => void) | undefined;

  constructor(options: LeadModuleViewOptions) {
    this.container = options.container;
    this.state = options.state ?? 'ready';
    this.activePath = options.activePath ?? '/leads';
    this.errorMessage = options.errorMessage;
    this.onRetry = options.onRetry;
  }

  render(): void {
    const knownPath = findLeadModuleNavigationItem(this.activePath);
    this.activePath = knownPath?.path ?? '/leads';

    this.container.replaceChildren();

    const root = createElement('section');
    root.className = 'business-module';
    root.setAttribute('aria-label', 'Lead Management');

    const header = createElement('header');
    header.className = 'business-module__header';

    const eyebrow = createElement('p', 'AXIVON ONE · BUS-003');
    eyebrow.className = 'business-module__eyebrow';
    header.appendChild(eyebrow);
    header.appendChild(createElement('h1', 'Lead Management'));
    header.appendChild(createElement('p', 'Reusable prospect tracking and lead-to-customer workflow foundation.'));
    root.appendChild(header);

    const body = createElement('div');
    body.className = 'business-module__body';

    const sidebar = createElement('aside');
    sidebar.className = 'business-module__sidebar';
    renderLeadModuleNavigation(sidebar, this.activePath);
    body.appendChild(sidebar);

    const content = createElement('main');
    content.className = 'business-module__content';
    renderLeadModuleState(content, this.state, this.errorMessage, this.onRetry);
    if (this.state === 'ready') renderContent(content, this.activePath);
    body.appendChild(content);

    root.appendChild(body);
    this.container.appendChild(root);
  }

  setState(state: LeadModuleState, errorMessage?: string): void {
    this.state = state;
    this.errorMessage = errorMessage;
    this.render();
  }
}
