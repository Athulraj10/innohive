import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi, getMe } from '../api/auth';
import { LoginRequest, User } from '../types/api';
import { clearJoinedCompetitions, syncJoinedCompetitions } from '../utils/joinedCompetitions';
import { getCompetitions } from '../api/competitions';
import { USER_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../constants/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
 
  const initialUser = getUserFromStorage();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const fetchJoinedCompetitions = async (): Promise<void> => {
    try {
      const response = await getCompetitions({ 
        joined: true, 
        limit: 1000
      });
  if (response.data && response.data.length > 0) {
        syncJoinedCompetitions(response.data);
      }
    } catch (error) {
       console.error('Failed to fetch joined competitions:', error);
    }
  };

  const checkAuth = async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const cachedUser = getUserFromStorage();
    
    if (!token) {
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    if (!user && cachedUser) {
      setUser(cachedUser);
    }

   if (!user && !cachedUser) {
      setIsLoading(true);
    }

    try {
      const response = await getMe();
      setUser(response.user);
      saveUserToStorage(response.user);
      
      fetchJoinedCompetitions();
    } catch (error: any) {
      const errorStatus = error.response?.status;
      const errorCode = error.response?.data?.error?.code;
      
      if (errorStatus === 401 || errorStatus === 403) {
         if (errorCode === 'UNAUTHORIZED' || error.response?.data?.error?.message?.toLowerCase().includes('token')) {
          console.log('Token is invalid (401/403 with auth error), clearing auth data');
          // localStorage.removeItem(TOKEN_STORAGE_KEY);
          // setUser(null);
          // saveUserToStorage(null);
        } else {
           console.log('Got 401/403 but error code suggests server issue, preserving localStorage');
          const currentUser = user || getUserFromStorage();
          if (currentUser && !user) {
            setUser(currentUser);
          }
        }
      } else if (!error.response) {
        console.log('Network error during auth check, preserving localStorage');
        const currentUser = user || getUserFromStorage();
        if (currentUser && !user) {
          setUser(currentUser);
        }
      } else {
       console.log('Server error during auth check, preserving localStorage:', errorStatus);
        const currentUser = user || getUserFromStorage();
        if (currentUser && !user) {
          setUser(currentUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
   }, []);

  const login = async (data: LoginRequest): Promise<void> => {
    const response = await loginApi(data);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setUser(response.user);
    saveUserToStorage(response.user); // Save user to localStorage
    
    fetchJoinedCompetitions();
  };

  const logout = (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Explicitly clear cached user on logout
    localStorage.removeItem(USER_STORAGE_KEY);
    clearJoinedCompetitions(); 
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!(user || localStorage.getItem(TOKEN_STORAGE_KEY)),
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

