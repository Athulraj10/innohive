import { useState } from 'react';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const exposure = user?.exposure ?? 0;
  const wallet = user?.walletBalance ?? 100;
  const balance = wallet - exposure;
  const navigate = useNavigate();
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="hidden sm:block text-xl font-bold text-gradient">Trading Competitions</h1>
            </div>
           
          </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 flex-nowrap w-full sm:w-auto justify-start sm:justify-end overflow-x-auto">
            {isAuthenticated ? (
              <>
                <div className="relative shrink-0">
                  <div
                    className="flex items-center space-x-2 sm:space-x-3 px-2 py-1 sm:px-4 bg-dark-card rounded-lg border border-dark-border sm:cursor-default cursor-pointer"
                    onClick={() => setMobileProfileOpen((o) => !o)}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-200 truncate max-w-[120px] sm:max-w-none">
                        {user?.name || 'User'}
                      </span>
                    </div>
                    <svg className="sm:hidden w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {mobileProfileOpen && (
                    <div className="sm:hidden absolute right-0 mt-2 w-40 bg-dark-card border border-dark-border rounded-lg shadow-lg z-50">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-dark-hover rounded-lg"
                      >
                        Logout
                      </button>
                      
                    </div>
                  )}
                </div>
                <Link to="/transactions" className="hidden sm:inline-flex btn-secondary text-sm shrink-0">
                  Transactions
                </Link>
                <div className="flex items-center space-x-3 px-2 py-1 sm:px-4 bg-dark-card rounded-lg border border-dark-border whitespace-nowrap shrink-0">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 sm:hidden">Exp</span>
                    <span className="hidden sm:inline text-xs text-gray-500">Exposure</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-200">{exposure}</span>
                  </div>
                  <div className="w-px h-6 bg-dark-border" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 sm:hidden">Bal</span>
                    <span className="hidden sm:inline text-xs text-gray-500">Balance</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-200">{balance}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex btn-secondary text-sm shrink-0"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-secondary text-sm shrink-0"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary text-sm shrink-0"
                  >
                    Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
