import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Token varsa kullanıcı bilgilerini al
      const response = await api.get('/user/profile');
      const userData = response.data.data;
      
      // Admin kontrolü
      if (userData.userType === 'admin') {
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data.data;

      localStorage.setItem('admin_accessToken', accessToken);
      localStorage.setItem('admin_refreshToken', refreshToken);

      // Kullanıcı bilgilerini al
      const userResponse = await api.get('/user/profile');
      const userData = userResponse.data.data;

      // Admin kontrolü
      if (userData.userType !== 'admin') {
        throw new Error('Bu panele sadece admin kullanıcılar erişebilir');
      }

      setUser(userData);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Giriş başarısız';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

