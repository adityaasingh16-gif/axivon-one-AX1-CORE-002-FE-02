import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './business-modules.css';

export function BusinessModuleShell({ modules, activeModule, children }) {
  const title = activeModule?.title || 'Business Modules';
  const description = activeModule?.description || 'Explore connected business workspaces.';
  return (
    <section className="business-shell" aria-labelledby="business-shell-title">
      <header className="business-shell__header">
        <div><p className="business-shell__eyebrow">AXIVON ONE · BUSINESS</p><h1 id="business-shell-title">{title}</h1><p>{description}</p></div>
        {activeModule && <Link className="business-shell__home" to="/business">All modules</Link>}
      </header>
      <nav className="business-shell__nav" aria-label="Business module navigation">
        <NavLink end to="/business">Overview</NavLink>
        {modules.map((module) => <NavLink key={module.id} to={module.path}>{module.title}</NavLink>)}
      </nav>
      <main className="business-shell__content" id="business-module-content" tabIndex={-1}>{children}</main>
    </section>
  );
}
