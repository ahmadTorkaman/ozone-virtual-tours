// ===========================================
// Ozone Virtual Tours - Main App
// ===========================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Tours from './pages/admin/Tours';
import TourEditor from './pages/admin/TourEditor';
import Materials from './pages/admin/Materials';
import BrandingSettings from './pages/admin/BrandingSettings';
import TeamSettings from './pages/admin/TeamSettings';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Viewer (legacy - will be updated later)
import TourViewer from './pages/viewer/TourViewer';

import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route (redirect to admin if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register/:token" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Tour Viewer (Public) */}
      <Route path="/tour/:slug" element={<TourViewer />} />

      {/* Admin Routes (Protected) */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="tours" element={<Tours />} />
        <Route path="tours/new" element={<TourEditor />} />
        <Route path="tours/:id" element={<TourEditor />} />
        <Route path="materials" element={<Materials />} />
        <Route path="branding" element={<BrandingSettings />} />
        <Route path="team" element={<TeamSettings />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <AppRoutes />
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
