// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages directly to ensure they work correctly in the demo
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { user, token, initialized } = useAuth();
  if (!initialized) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { token, initialized } = useAuth();
  if (!initialized) return <Spinner />;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

const Spinner = () => (
  <div className="app-loader">
    <div className="loader-ring"></div>
    <p style={{ marginTop: '16px', color: 'var(--text2)' }}>Loading JobPortal...</p>
  </div>
);

function AppRoutes() {
  const { initialized } = useAuth();
  if (!initialized) return <Spinner />;

  return (
    <Routes>
      <Route path="/"             element={<HomePage />} />
      <Route path="/jobs"         element={<JobsPage />} />
      <Route path="/jobs/:id"     element={<JobDetailPage />} />
      <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp"   element={<OTPPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin"        element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
      <Route path="*"             element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '10px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
