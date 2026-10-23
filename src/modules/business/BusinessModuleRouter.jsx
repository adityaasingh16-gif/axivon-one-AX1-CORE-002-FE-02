import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { businessModules } from './BusinessModuleRegistry';
import { BusinessModuleShell } from './BusinessModuleShell';
import { BusinessModuleState } from './BusinessModuleState';

export function BusinessModuleRouter() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, '') || '/business';
  const activeModule = businessModules.find((module) => module.path === path);
  if (path !== '/business' && !activeModule) {
    return <BusinessModuleShell modules={businessModules}><BusinessModuleState state="empty" title="Module not found" message="Choose a business workspace from the navigation above." /></BusinessModuleShell>;
  }
  return (
    <BusinessModuleShell modules={businessModules} activeModule={activeModule}>
      {activeModule ? <activeModule.Component /> : (
        businessModules.length ? <div className="business-module-grid">{businessModules.map((module) => (
          <Link className="business-module-card" key={module.id} to={module.path}>
            <span>{module.id}</span><h2>{module.title}</h2><p>{module.description}</p><strong>Open workspace →</strong>
          </Link>
        ))}</div> : <BusinessModuleState state="empty" title="No modules are available yet" message="Business workspaces will appear here as they are enabled." />)
      }
    </BusinessModuleShell>
  );
}
