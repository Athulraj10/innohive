import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TOKEN_STORAGE_KEY } from '../constants/storage';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => {
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              window.location.href = '/admin/login';
            }}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

