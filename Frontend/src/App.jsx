import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import WelcomePage from './pages/WelcomePage';

import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetPassword from './pages/SetPassword';

// Role-specific layouts
import AdminLayout from './layouts/AdminLayout';
import ManagerLayout from './layouts/ManagerLayout';
import DeveloperLayout from './layouts/DeveloperLayout';

// Role-specific dashboards
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import DeveloperProjectDashboard from './pages/developer/DeveloperProjectDashboard';

// Shared pages
import Projects from './pages/Projects';
import TeamDashboard from './pages/TeamDashboard';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import ProjectDashboard from './pages/projects/ProjectDashboard';
import ProfilePage from './pages/ProfilePage';

import WorkflowLoader from './components/common/WorkflowLoader';
import useMinLoader from './hooks/useMinLoader';
import AiAnalyzerPage from './pages/AiAnalyzerPage';

// Helper to handle redirect logic
const NavigationHandler = () => {
  const { user, loading } = useAuth();
  const showLoader = useMinLoader(loading);

  if (showLoader) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <WorkflowLoader message="Initializing application…" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'projectManager' ? '/manager/dashboard' : '/developer/dashboard'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'projectManager' ? '/manager/dashboard' : '/developer/dashboard'} />} />

      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id/dashboard" element={<ProjectDashboard />} />
        <Route path="team" element={<TeamDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="ai-analyzer" element={<AiAnalyzerPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Project Manager Routes */}
      <Route path="/manager" element={
        <PrivateRoute allowedRoles={['projectManager']}>
          <ManagerLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id/dashboard" element={<ProjectDashboard />} />
        <Route path="team" element={<TeamDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Developer Routes */}
      <Route path="/developer" element={
        <PrivateRoute allowedRoles={['developer']}>
          <DeveloperLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<DeveloperDashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<DeveloperProjectDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Project Dashboard (Shared - Admin & PM only) */}
      <Route
        path="/projects/:id/dashboard"
        element={
          <PrivateRoute allowedRoles={['admin', 'projectManager']}>
            <ProjectDashboard />
          </PrivateRoute>
        }
      />

      {/* Workflow Editor (Full Screen - Outside Layout) */}
      <Route
        path="/workflow/:projectId"
        element={
          <PrivateRoute>
            <WorkflowEditorPage />
          </PrivateRoute>
        }
      />

      {/* Root — WelcomePage for guests, dashboard redirect for logged-in users */}
      <Route path="/" element={
        user ? <RoleBasedRedirect /> : <WelcomePage />
      } />

      {/* 404 Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// Component to redirect to role-based dashboard
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'projectManager') {
    return <Navigate to="/manager/dashboard" replace />;
  } else if (user?.role === 'developer') {
    return <Navigate to="/developer/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <NavigationHandler />
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;