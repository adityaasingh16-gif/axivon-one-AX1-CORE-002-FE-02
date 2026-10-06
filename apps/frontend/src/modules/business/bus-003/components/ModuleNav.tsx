import type { ModuleNavItem } from '../contracts';

export function ModuleNav({ items, activePath }: { items: ModuleNavItem[]; activePath?: string }) {
  return (
    <nav aria-label="Module navigation" className="bus003-nav">
      <ul className="bus003-nav__list">
        {items.map((item) => (
          <li key={item.id} className="bus003-nav__item">
            <a
              href={item.href}
              aria-current={activePath === item.href ? 'page' : undefined}
              className={activePath === item.href ? 'bus003-nav__link bus003-nav__link--active' : 'bus003-nav__link'}
            >
              <span>{item.label}</span>
              {item.description ? <small>{item.description}</small> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
