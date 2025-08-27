import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';
import { Platform } from 'react-native';

// Android emulator ve gerçek cihaz için IP adresi kullan
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://192.168.1.108:3000/api' 
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token ekleme
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token da geçersiz, kullanıcıyı logout yap
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // Burada navigation ile login ekranına yönlendirme yapılabilir
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', credentials);
    return response.data.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthTokens> => {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/register', credentials);
    return response.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/user/profile');
    return response.data.data;
  },
};

export default api;
