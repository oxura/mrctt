import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
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
import { Role } from './types';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'superadmin' && !user?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/onboarding"
          element={
            isAuthenticated && user?.role !== 'superadmin' && !user?.onboardingCompleted ? (
              <OnboardingWizard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route path="/forms/:formId/public" element={<PublicForm />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute allowedRoles={['owner', 'admin']}><Analytics /></PrivateRoute>} />
        <Route path="/leads" element={<PrivateRoute><Leads /></PrivateRoute>} />
        <Route path="/leads/:id" element={<PrivateRoute><LeadDetail /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute allowedRoles={['owner', 'admin']}><Products /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
        <Route path="/team" element={<PrivateRoute allowedRoles={['owner', 'admin']}><Team /></PrivateRoute>} />
        <Route path="/forms" element={<PrivateRoute allowedRoles={['owner', 'admin']}><FormBuilder /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute allowedRoles={['owner', 'admin']}><Settings /></PrivateRoute>} />
        <Route path="/billing" element={<PrivateRoute allowedRoles={['owner']}><Billing /></PrivateRoute>} />
        <Route path="/superadmin" element={<PrivateRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
