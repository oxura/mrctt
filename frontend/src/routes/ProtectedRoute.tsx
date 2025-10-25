import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectTo = '/login' }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenant = useAuthStore((state) => state.tenant);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const onboardingCompleted = Boolean(tenant?.settings?.onboarding?.completed);
  const isOnboardingPath = location.pathname.startsWith('/onboarding');

  if (!onboardingCompleted && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingCompleted && isOnboardingPath) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
