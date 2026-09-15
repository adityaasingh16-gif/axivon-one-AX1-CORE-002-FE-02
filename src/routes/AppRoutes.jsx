import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Views
import { LoginView } from '../views/LoginView';
import { RegisterView } from '../views/RegisterView';
import { VerificationView } from '../views/VerificationView';
import { ForgotPasswordView } from '../views/ForgotPasswordView';
import { ResetPasswordView } from '../views/ResetPasswordView';
import { DashboardView } from '../views/DashboardView';
import { SessionManagementView } from '../views/SessionManagementView';
import { OrganizationListView } from '../views/OrganizationListView';
import { OrganizationSetupView } from '../views/OrganizationSetupView';
import { OrganizationDetailsView } from '../views/OrganizationDetailsView';
import { OrganizationEditView } from '../views/OrganizationEditView';

// Layout & Route Guards
import { SidebarLayout } from '../components/layout/SidebarLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { GuestRoute } from '../components/guards/GuestRoute';

// Helper to wrap protected views inside the enterprise SidebarLayout
const ProtectedView = ({ children }) => (
  <ProtectedRoute requireVerification={false}>
    <SidebarLayout>{children}</SidebarLayout>
  </ProtectedRoute>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Guest Public Routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginView />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterView />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordView />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordView />
          </GuestRoute>
        }
      />

      {/* Account Verification Route */}
      <Route
        path="/verify"
        element={
          <ProtectedView>
            <VerificationView />
          </ProtectedView>
        }
      />

      {/* Protected Member Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedView>
            <DashboardView />
          </ProtectedView>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedView>
            <SessionManagementView />
          </ProtectedView>
        }
      />

      {/* Protected Organization Routes */}
      <Route
        path="/organizations"
        element={
          <ProtectedView>
            <OrganizationListView />
          </ProtectedView>
        }
      />
      <Route
        path="/organizations/new"
        element={
          <ProtectedView>
            <OrganizationSetupView />
          </ProtectedView>
        }
      />
      <Route
        path="/organizations/:orgId"
        element={
          <ProtectedView>
            <OrganizationDetailsView />
          </ProtectedView>
        }
      />
      <Route
        path="/organizations/:orgId/edit"
        element={
          <ProtectedView>
            <OrganizationEditView />
          </ProtectedView>
        }
      />

      {/* Default Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
