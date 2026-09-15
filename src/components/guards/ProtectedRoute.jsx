import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, requireVerification = true, requiredRole = null }) => {
  const { user, isAuthenticated, isVerified, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-gray-300">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-400">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login preserving destination state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerification && !isVerified) {
    // Redirect unverified users to verification page
    return <Navigate to="/verify" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center border border-red-500/20">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your current role <span className="text-indigo-400 font-semibold">({user?.role})</span> does not have sufficient permissions to view this resource.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return children;
};
