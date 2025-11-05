import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvite from './pages/auth/AcceptInvite';
import Dashboard from './pages/dashboard/Dashboard';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import Landing from './pages/landing/Landing';
import ProtectedRoute from './routes/ProtectedRoute';
import Leads from './pages/leads/Leads';
import LeadDetail from './pages/leads/LeadDetail';
import Products from './pages/products/Products';
import Groups from './pages/groups/Groups';
import Forms from './pages/forms/Forms';
import FormBuilder from './pages/forms/FormBuilder';
import Tasks from './pages/tasks/Tasks';
import Team from './pages/team/Team';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import Notifications from './pages/notifications/Notifications';
import ComponentsDemo from './pages/components-demo/ComponentsDemo';
import PublicForm from './pages/public/PublicForm';
import Billing from './pages/billing/Billing';
import Plans from './pages/billing/Plans';
import { useAuthStore } from './store/authStore';

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/public-form/:publicUrl" element={<PublicForm />} />

      <Route element={<ProtectedRoute />}> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/forms/builder" element={<FormBuilder />} />
        <Route path="/forms/builder/:id" element={<FormBuilder />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/plans" element={<Plans />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/components-demo" element={<ComponentsDemo />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};

export default App;
