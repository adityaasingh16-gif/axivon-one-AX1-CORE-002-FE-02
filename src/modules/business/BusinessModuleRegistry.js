/** Vite discovers each module page so adding a module does not require editing a central route list. */
const pageModules = import.meta.glob('./*/page.jsx', { eager: true });

export const businessModules = Object.values(pageModules)
  .map((page) => ({ ...page.moduleManifest, Component: page.default }))
  .filter((module) => module.id && module.path && module.title && module.Component)
  .sort((left, right) => left.title.localeCompare(right.title));
