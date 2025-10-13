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

export const leagueService = {
  // Lig ayarlarını getir
  getLeagueSettings: async () => {
    const response = await api.get('/league/settings');
    return response.data.data;
  },

  // Lig ayarlarını güncelle
  updateLeagueSettings: async (settings: any) => {
    const response = await api.put('/league/settings', settings);
    return response.data.data;
  },

  // Lig sıralamasını getir
  getLeagueRankings: async () => {
    const response = await api.get('/league/rankings');
    return response.data.data;
  },

  // Kullanıcının lig bilgilerini getir
  getUserLeagueInfo: async (userId: string) => {
    const response = await api.get(`/league/user/${userId}`);
    return response.data.data;
  },

  // Teklif yapılabilecek oyuncuları getir
  getAvailableOpponents: async (userId: string) => {
    const response = await api.get(`/league/available-opponents/${userId}`);
    return response.data.data;
  },

  // Maç teklifi gönder
  sendMatchChallenge: async (challengerId: string, opponentId: string, message: string) => {
    const response = await api.post('/league/challenge', {
      challengerId,
      opponentId,
      message,
    });
    return response.data.data;
  },

  // Maç sonucu kaydet
  recordMatchResult: async (matchId: number, winnerId: string, loserId: string, score: string) => {
    const response = await api.post('/league/match-result', {
      matchId,
      winnerId,
      loserId,
      score,
    });
    return response.data.data;
  },
};

export const reservationService = {
  // Tarihe göre rezervasyonları getir
  getReservationsByDate: async (date: string) => {
    const response = await api.get('/reservations', { params: { date } });
    return response.data.data;
  },

  // Kullanıcının rezervasyonlarını getir
  getMyReservations: async () => {
    const response = await api.get('/reservations/my');
    return response.data.data;
  },

  // Yeni rezervasyon oluştur
  createReservation: async (data: {
    courtNumber: number;
    startTime: string;
    endTime: string;
    participants?: string[];
    notes?: string;
  }) => {
    const response = await api.post('/reservations', data);
    return response.data.data;
  },

  // Rezervasyon iptal et
  cancelReservation: async (reservationId: number) => {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  },
};

export const announcementService = {
  // Tüm duyuruları getir
  getAllAnnouncements: async () => {
    const response = await api.get('/announcements');
    return response.data.data;
  },

  // Yeni duyuru oluştur (Admin)
  createAnnouncement: async (data: {
    title: string;
    content: string;
    targetGroup?: string;
    isPinned?: boolean;
  }) => {
    const response = await api.post('/announcements', data);
    return response.data.data;
  },

  // Duyuru güncelle
  updateAnnouncement: async (announcementId: number, data: any) => {
    const response = await api.put(`/announcements/${announcementId}`, data);
    return response.data.data;
  },

  // Duyuru sil
  deleteAnnouncement: async (announcementId: number) => {
    const response = await api.delete(`/announcements/${announcementId}`);
    return response.data;
  },
};

export const tournamentService = {
  // Tüm turnuvaları getir
  getAllTournaments: async () => {
    const response = await api.get('/tournaments');
    return response.data.data;
  },

  // Turnuva bracket'ını getir
  getTournamentBracket: async (tournamentId: number) => {
    const response = await api.get(`/tournaments/${tournamentId}/bracket`);
    return response.data.data;
  },

  // Yeni turnuva oluştur (Admin)
  createTournament: async (data: {
    name: string;
    size: number;
    startDate: string;
    playerIds: string[];
  }) => {
    const response = await api.post('/tournaments', data);
    return response.data.data;
  },

  // Maç sonucunu kaydet
  reportMatchResult: async (matchId: number, data: {
    winnerId: string;
    score: string;
  }) => {
    const response = await api.post(`/tournaments/matches/${matchId}/result`, data);
    return response.data.data;
  },
};

export default api;
