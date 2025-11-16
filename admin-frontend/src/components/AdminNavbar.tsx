import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-danger-500 to-danger-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-100">Admin Panel</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              <Link
                to="/admin/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-hover'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/competitions"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/competitions')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-hover'
                }`}
              >
                Competitions
              </Link>
              <Link
                to="/admin/users"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-hover'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admin/transactions"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/transactions')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-hover'
                }`}
              >
                Transactions
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm px-4 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

