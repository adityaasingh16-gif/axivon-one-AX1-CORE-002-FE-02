import { ModuleLayout } from './components/ModuleLayout';
import type { ModuleNavItem, ModuleState } from './contracts';
import './styles.css';

const navigation: ModuleNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/business/overview', description: 'Module summary' },
  { id: 'workspace', label: 'Workspace', href: '/business/workspace', description: 'Primary work area' },
  { id: 'activity', label: 'Activity', href: '/business/activity', description: 'Recent activity' },
];

export function BusinessModuleScreen({ activePath = '/business/overview', state = 'ready', errorMessage, onRetry }: {
  activePath?: string;
  state?: ModuleState;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  return (
    <ModuleLayout
      title="Business Workspace"
      description="A responsive foundation for business workflows, shared navigation and future module screens."
      navigation={navigation}
      activePath={activePath}
      state={state}
      errorMessage={errorMessage}
      onRetry={onRetry}
    >
      <section className="bus003-card" aria-labelledby="bus003-overview-title">
        <div>
          <p className="bus003-eyebrow">Module foundation</p>
          <h2 id="bus003-overview-title">Ready for workflow screens</h2>
          <p>The module shell, navigation and state handling are ready for the next business workflow layer.</p>
        </div>
        <div className="bus003-grid" aria-label="Foundation capabilities">
          <article><strong>Navigation</strong><span>Route-ready primary navigation</span></article>
          <article><strong>Components</strong><span>Reusable shell, nav and state primitives</span></article>
          <article><strong>Responsive</strong><span>Desktop and compact layouts</span></article>
          <article><strong>States</strong><span>Loading, empty and error handling</span></article>
        </div>
      </section>
    </ModuleLayout>
  );
}
