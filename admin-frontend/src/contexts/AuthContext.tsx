import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi } from '../api/auth';
import { LoginRequest, User } from '../types/api';
import { USER_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../constants/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  return null;
};

const saveUserToStorage = (user: User | null): void => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      saveUserToStorage(null);
      setIsLoading(false);
      return;
    }

    const cachedUser = getUserFromStorage();
    if (cachedUser && !user) {
      setUser(cachedUser);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: LoginRequest): Promise<void> => {
    const response = await loginApi(data);

    if (response.user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin role required.');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setUser(response.user);
    saveUserToStorage(response.user);
  };

  const logout = (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

