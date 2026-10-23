import React from 'react';
import { EmployeeManagementView } from '../../../views/EmployeeManagementView';

export const moduleManifest = {
  id: 'BUS-007',
  path: '/business/employees',
  title: 'Employee Management',
  description: 'Manage employee records, departments, and employment status.',
};

export default function EmployeeModulePage() {
  return <EmployeeManagementView />;
}
