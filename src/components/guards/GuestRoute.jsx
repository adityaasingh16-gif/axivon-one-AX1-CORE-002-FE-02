import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isVerified, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Redirect authenticated & verified users away from auth pages
  if (isAuthenticated && isVerified) {
    const origin = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={origin} replace />;
  }

  return children;
};
