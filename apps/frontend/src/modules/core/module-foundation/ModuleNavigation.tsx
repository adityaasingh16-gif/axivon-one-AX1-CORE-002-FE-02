import type { ModuleNavItem } from './contracts';

type Props = { items: ModuleNavItem[]; activeItemId?: string };

export function ModuleNavigation({ items, activeItemId }: Props) {
  return (
    <nav aria-label="Module navigation">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.href} aria-current={item.id === activeItemId ? 'page' : undefined}>
              <span>{item.label}</span>
              {item.description ? <small>{item.description}</small> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
