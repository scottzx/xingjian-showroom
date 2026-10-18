import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WrapDesignerPage } from './editor/WrapDesignerPage';
import { FreeEditorPage } from './editor/FreeEditorPage';
import { LandingPage } from './pages/LandingPage';
import { GalleryPage } from './pages/GalleryPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ProfilePage } from './pages/ProfilePage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tesla-black">
        <div className="text-tesla-light">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/legacy" replace />;
  }

  return <>{children}</>;
}

// Redirect to gallery if logged in, landing page otherwise
function IndexRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tesla-black">
        <div className="text-tesla-light">Loading...</div>
      </div>
    );
  }

  return user ? <Navigate to="/gallery" replace /> : <LandingPage />;
}

function LegacyApp() {

  return (
    <AuthProvider>
        <Routes>
          {/* Root - redirects based on auth status */}
          <Route path="/legacy" element={<IndexRedirect />} />

          {/* Public routes */}
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/editor/free" element={<FreeEditorPage />} />

          {/* Protected routes */}
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <WrapDesignerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AuthProvider>
  );
}

export default LegacyApp;
