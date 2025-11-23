import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setLogoutCallback } from '../services/api';
import api from '../services/api';
import { AppState } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, age?: number) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      console.log('Token kontrolü:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken 
      });
      
      if (accessToken && refreshToken) {
        // Token var, gerçek bir API isteği yaparak doğrula
        try {
          await authService.getProfile();
          console.log('Token geçerli - kullanıcı authenticated');
          setIsAuthenticated(true);
        } catch (error: any) {
          // Token geçersiz veya servis çalışmıyor
          console.log('Token geçersiz veya servis çalışmıyor - logout yapılıyor:', error.message);
          // Token'ları sil ve authenticated durumunu false yap
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setIsAuthenticated(false);
        }
      } else {
        console.log('Token bulunamadı - login gerekli');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // API interceptor'dan gelen logout callback'ini kaydet
    setLogoutCallback(() => {
      console.log('API interceptor logout tetiklendi');
      logout();
    });
    
    // Uygulama ön plana geldiğinde token kontrolü yap
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAuth();
      }
    });

    return () => {
      subscription.remove();
      setLogoutCallback(() => {}); // Cleanup
    };
  }, [logout]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Login başlatılıyor:', { email, apiUrl: 'http://192.168.1.107:3000/api' });
      const tokens = await authService.login({ email, password });
      console.log('✅ Login başarılı, token kaydediliyor');
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('❌ Login hatası:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, age?: number) => {
    try {
      const tokens = await authService.register({ name, email, password, age });
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Token'ları sil ve durumu güncelle
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
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

