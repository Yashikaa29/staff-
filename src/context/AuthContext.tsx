import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export type UserRole = 'HR' | 'Manager' | 'Employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  phone?: string;
  joiningDate?: string;
  status: 'Active' | 'Inactive';
  managerId?: string | { _id: string; name: string; email: string };
  managerName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfileState: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('staffsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('staffsync_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const savedToken = localStorage.getItem('staffsync_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('staffsync_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.warn('Failed to verify token, clearing session:', err);
      localStorage.removeItem('staffsync_token');
      localStorage.removeItem('staffsync_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('staffsync_token', newToken);
      localStorage.setItem('staffsync_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }
  };

  const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('staffsync_token', newToken);
      localStorage.setItem('staffsync_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }
  };

  const quickLogin = async (role: UserRole) => {
    const credentials = {
      HR: { email: 'hr@staffsync.com', password: 'password123' },
      Manager: { email: 'manager@staffsync.com', password: 'password123' },
      Employee: { email: 'employee@staffsync.com', password: 'password123' },
    };
    const cred = credentials[role];
    await login(cred.email, cred.password);
  };

  const logout = () => {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateProfileState = (updated: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      localStorage.setItem('staffsync_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        quickLogin,
        logout,
        refreshUser,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
