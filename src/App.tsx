import { useEffect } from 'react';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import RecoverPassword from './pages/auth/RecoverPassword';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import Dashboard from './pages/dashboard/Dashboard';
import Leads from './pages/leads/Leads';
import LeadDetail from './pages/leads/LeadDetail';
import Products from './pages/products/Products';
import Calendar from './pages/calendar/Calendar';
import Analytics from './pages/analytics/Analytics';
import Team from './pages/team/Team';
import Settings from './pages/settings/Settings';
import Billing from './pages/billing/Billing';
import FormBuilder from './pages/forms/FormBuilder';
import PublicForm from './pages/forms/PublicForm';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import MainLayout from './components/layout/MainLayout';
import type { Role } from './types';

function PrivateRoute() {
  const { isAuthenticated, user, sessionExpiresAt, logout } = useAuthStore();
  const sessionExpired = Boolean(
    isAuthenticated && sessionExpiresAt && sessionExpiresAt <= Date.now()
  );

  useEffect(() => {
    if (sessionExpired) {
      logout();
    }
  }, [sessionExpired, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!sessionExpiresAt) {
    return <Navigate to="/login" replace />;
  }

  if (sessionExpired) {
    return <Navigate to="/login?expired=1" replace />;
  }

  if (user?.role !== 'superadmin' && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <MainLayout><Outlet /></MainLayout>;
}

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute() {
  const { isAuthenticated, user, sessionExpiresAt } = useAuthStore();
  const hasActiveSession = Boolean(
    isAuthenticated && sessionExpiresAt && sessionExpiresAt > Date.now()
  );

  if (hasActiveSession && user?.role !== 'superadmin' && !user?.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return <Navigate to="/" replace />;
}

const router = createBrowserRouter(
  [
    {
      path: '/signup',
      element: <SignUp />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/recover',
      element: <RecoverPassword />,
    },
    {
      path: '/forms/:formId/public',
      element: <PublicForm />,
    },
    {
      path: '/onboarding',
      element: <OnboardingRoute />,
    },
    {
      path: '/',
      element: <PrivateRoute />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: 'analytics',
          element: (
            <RoleGuard allowedRoles={['owner', 'admin']}>
              <Analytics />
            </RoleGuard>
          ),
        },
        {
          path: 'leads',
          element: <Leads />,
        },
        {
          path: 'leads/:id',
          element: <LeadDetail />,
        },
        {
          path: 'products',
          element: (
            <RoleGuard allowedRoles={['owner', 'admin']}>
              <Products />
            </RoleGuard>
          ),
        },
        {
          path: 'calendar',
          element: <Calendar />,
        },
        {
          path: 'team',
          element: (
            <RoleGuard allowedRoles={['owner', 'admin']}>
              <Team />
            </RoleGuard>
          ),
        },
        {
          path: 'forms',
          element: (
            <RoleGuard allowedRoles={['owner', 'admin']}>
              <FormBuilder />
            </RoleGuard>
          ),
        },
        {
          path: 'settings',
          element: (
            <RoleGuard allowedRoles={['owner', 'admin']}>
              <Settings />
            </RoleGuard>
          ),
        },
        {
          path: 'billing',
          element: (
            <RoleGuard allowedRoles={['owner']}>
              <Billing />
            </RoleGuard>
          ),
        },
        {
          path: 'superadmin',
          element: (
            <RoleGuard allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </RoleGuard>
          ),
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
