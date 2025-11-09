import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';
import { Platform } from 'react-native';

// Gerçek cihaz için bilgisayarın IP adresini kullan
// WiFi üzerinden bağlantı için localhost yerine IP gerekli
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.104:3000/api'  // Development - bilgisayarınızın local IP'si
  : 'http://192.168.1.104:3000/api'; // Production - gerçek backend URL'i buraya gelecek

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
    
    // Token expired veya unauthorized durumunda
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('Access token expired, refreshing...');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          console.log('Token refreshed successfully');
          // Yeni access token ile tekrar dene
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token da geçersiz, kullanıcıyı logout yap
        console.error('Refresh token failed, clearing tokens:', refreshError);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // AuthContext yeniden yüklenecek ve kullanıcıyı login'e yönlendirecek
        return Promise.reject(new Error('Session expired. Please login again.'));
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

  updateProfile: async (profileData: {
    name?: string;
    surname?: string;
    phone?: string;
    profilePhoto?: string;
  }): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/user/profile', profileData);
    return response.data.data;
  },
};

export const userService = {
  // Tüm kullanıcıları getir (Members screen için)
  getAllUsers: async () => {
    const response = await api.get('/user/all');
    return response.data.data;
  },

  // Belirli bir tarih ve saat aralığında rezervasyonu olmayan kullanıcıları getir
  getAvailableUsersForTimeSlot: async (startTime: string, endTime: string) => {
    const response = await api.get('/user/available', { params: { startTime, endTime } });
    return response.data.data;
  },
};

export const coachService = {
  // Tüm antrenörleri getir
  getAllCoaches: async () => {
    const response = await api.get('/coaches');
    return response.data.data;
  },

  // Belirli bir antrenörü getir
  getCoachById: async (id: string) => {
    const response = await api.get(`/coaches/${id}`);
    return response.data.data;
  },
};

export const leagueService = {
  // ==================== League Entity CRUD ====================
  
  // Tüm ligleri getir (settings ile birlikte)
  getAllLeagues: async () => {
    const response = await api.get('/league/all');
    const leagues = response.data.data;
    
    if (!leagues || leagues.length === 0) {
      return [];
    }
    
    // Her lig için settings'i de çek
    const leaguesWithSettings = await Promise.all(
      leagues.map(async (league: any) => {
        try {
          const settingsResponse = await api.get('/league/settings', { params: { leagueId: league.id } });
          return {
            ...league,
            settings: settingsResponse.data.data
          };
        } catch (error) {
          console.error(`League ${league.id} settings fetch error:`, error);
          return league;
        }
      })
    );
    
    return leaguesWithSettings;
  },

  // Belirli bir ligi getir
  getLeagueById: async (id: number) => {
    const response = await api.get(`/league/entity/${id}`);
    return response.data.data;
  },

  // Code'a göre ligi getir
  getLeagueByCode: async (code: string) => {
    const response = await api.get(`/league/code/${code}`);
    return response.data.data;
  },

  // Yeni lig oluştur
  createLeague: async (data: { name: string; code: string; description?: string }) => {
    const response = await api.post('/league/create', data);
    return response.data.data;
  },

  // Lig güncelle
  updateLeague: async (id: number, data: { name?: string; code?: string; description?: string }) => {
    const response = await api.put(`/league/entity/${id}`, data);
    return response.data.data;
  },

  // Lig sil
  deleteLeague: async (id: number) => {
    const response = await api.delete(`/league/entity/${id}`);
    return response.data;
  },

  // ==================== League Settings ====================

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
};

export const leagueStandingsService = {
  // ==================== League Standings CRUD ====================

  // Tüm standings'leri getir
  getAllStandings: async () => {
    const response = await api.get('/league/standings');
    return response.data.data;
  },

  // ID'ye göre standing getir
  getStandingById: async (id: number) => {
    const response = await api.get(`/league/standings/${id}`);
    return response.data.data;
  },

  // Belirli bir lige ait standings'leri getir
  getStandingsByLeagueId: async (leagueId: number) => {
    const response = await api.get(`/league/standings/league/${leagueId}`);
    return response.data.data;
  },

  // Belirli bir kullanıcıya ait standings'leri getir
  getStandingsByUserId: async (userId: string) => {
    const response = await api.get(`/league/standings/user/${userId}`);
    return response.data.data;
  },

  // Yeni standing oluştur
  createStanding: async (data: {
    leagueRanking: number;
    description?: string;
    userId: number;
    leagueId: number;
  }) => {
    const response = await api.post('/league/standings', data);
    return response.data.data;
  },

  // Standing güncelle
  updateStanding: async (id: number, data: {
    leagueRanking?: number;
    description?: string;
  }) => {
    const response = await api.put(`/league/standings/${id}`, data);
    return response.data.data;
  },

  // Standing sil
  deleteStanding: async (id: number) => {
    const response = await api.delete(`/league/standings/${id}`);
    return response.data;
  },

  // Kullanıcının lig sıralamasını güncelle (maç sonucuna göre)
  updateUserRanking: async (leagueId: number, winnerId: string, loserId: string, score: string, courtId?: number) => {
    const response = await api.put('/league/standings/ranking', {
      leagueId,
      challengerId: winnerId,
      challengedId: loserId,
      score,
      courtId,
    });
    return response.data.data;
  },

  // Kullanıcıyı lige ekle
  joinLeague: async (userId: string, leagueId: number) => {
    const response = await api.post('/league/join', { userId, leagueId });
    return response.data;
  },

  // ==================== Rankings & Match Functions ====================

  // Lig sıralamasını getir
  getLeagueRankings: async (leagueId?: number) => {
    const params = leagueId ? { leagueId } : {};
    const response = await api.get('/league/rankings', { params });
    return response.data.data;
  },

  // Kullanıcının lig bilgilerini getir
  getUserLeagueInfo: async (userId: string, leagueId?: number) => {
    const params = leagueId ? { leagueId } : {};
    const response = await api.get(`/league/user/${userId}`, { params });
    return response.data.data;
  },

  // Teklif yapılabilecek oyuncuları getir
  getAvailableOpponents: async (userId: string, leagueId?: number) => {
    const params = leagueId ? { leagueId } : {};
    const response = await api.get(`/league/available-opponents/${userId}`, { params });
    return response.data.data;
  },
};

export const reservationService = {
  // Yakın zamandaki rezervasyonları getir
  getUpcomingReservations: async (limit: number = 2) => {
    const response = await api.get('/reservations/upcoming', { params: { limit } });
    return response.data.data;
  },

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
    participantIds?: string[];
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

export const courtService = {
  // Tüm kortları getir
  getAllCourts: async () => {
    const response = await api.get('/courts');
    return response.data.data;
  },

  // Aktif kortları getir
  getActiveCourts: async () => {
    const response = await api.get('/courts/active');
    return response.data.data;
  },

  // ID'ye göre kort getir
  getCourtById: async (courtId: number) => {
    const response = await api.get(`/courts/${courtId}`);
    return response.data.data;
  },

  // Yeni kort oluştur
  createCourt: async (data: {
    name: string;
    indoors?: boolean;
    groundType?: 'grass' | 'clay' | 'hard';
    closed?: boolean;
  }) => {
    const response = await api.post('/courts', data);
    return response.data.data;
  },

  // Kort güncelle
  updateCourt: async (courtId: number, data: {
    name?: string;
    indoors?: boolean;
    groundType?: 'grass' | 'clay' | 'hard';
    closed?: boolean;
  }) => {
    const response = await api.put(`/courts/${courtId}`, data);
    return response.data.data;
  },

  // Kort sil
  deleteCourt: async (courtId: number) => {
    const response = await api.delete(`/courts/${courtId}`);
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

export const matchHistoryService = {
  // Tüm maç geçmişini getir
  getAllMatches: async () => {
    const response = await api.get('/match-history');
    return response.data.data;
  },

  // Kullanıcının maç geçmişini getir
  getUserMatchHistory: async (userId: string) => {
    const response = await api.get(`/match-history/user/${userId}`);
    return response.data.data;
  },

  // Lige göre maç geçmişini getir
  getMatchHistoryByLeague: async (leagueId: number) => {
    const response = await api.get(`/match-history/league/${leagueId}`);
    return response.data.data;
  },
};

export const commentService = {
  // Maça ait tüm yorumları getir
  getMatchComments: async (matchHistoryId: number) => {
    const response = await api.get(`/comments/match/${matchHistoryId}`);
    return response.data.data;
  },

  // Maçın yorum sayısını getir
  getCommentCount: async (matchHistoryId: number) => {
    const response = await api.get(`/comments/match/${matchHistoryId}/count`);
    return response.data.data.count;
  },

  // Yeni yorum oluştur
  createComment: async (data: {
    matchHistoryId: number;
    comment: string;
    commentType?: string;
  }) => {
    const response = await api.post('/comments', data);
    return response.data.data;
  },

  // Yorumu güncelle
  updateComment: async (commentId: number, comment: string) => {
    const response = await api.put(`/comments/${commentId}`, { comment });
    return response.data.data;
  },

  // Yorumu sil
  deleteComment: async (commentId: number) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  // Belirli bir yorumu getir
  getCommentById: async (commentId: number) => {
    const response = await api.get(`/comments/${commentId}`);
    return response.data.data;
  },
};

// Notification servisleri
export const notificationService = {
  // Kullanıcının notification'larını getir (pagination ile)
  getUserNotifications: async (page: number = 1, limit: number = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Okunmamış notification sayısını getir
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  // Belirli bir notification'ı getir
  getNotificationById: async (notificationId: number) => {
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data.data;
  },

  // Notification'ı okundu olarak işaretle
  markAsRead: async (notificationId: number) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  // Tüm notification'ları okundu olarak işaretle
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Notification'ı sil
  deleteNotification: async (notificationId: number) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Tüm notification'ları sil
  deleteAllNotifications: async () => {
    const response = await api.delete('/notifications/delete-all');
    return response.data;
  },
};

// Match Challenge servisleri
export const matchChallengeService = {
  // Yeni maç teklifi oluştur
  createChallenge: async (data: {
    challengedId: string;
    leagueId: number;
    message?: string;
    proposedDate?: string;
    expiresInDays?: number;
  }) => {
    const response = await api.post('/match-challenges', data);
    return response.data.data;
  },

  // Kullanıcının aldığı bekleyen teklifleri getir
  getPendingChallenges: async () => {
    const response = await api.get('/match-challenges/pending');
    return response.data.data;
  },

  // Kullanıcının gönderdiği teklifleri getir
  getSentChallenges: async () => {
    const response = await api.get('/match-challenges/sent');
    return response.data.data;
  },

  // Kullanıcının tüm challengelarını getir
  getUserChallenges: async () => {
    const response = await api.get('/match-challenges/my');
    return response.data.data;
  },

  // Tüm challengeları getir (admin)
  getAllChallenges: async () => {
    const response = await api.get('/match-challenges/all');
    return response.data.data;
  },

  // ID'ye göre challenge detayını getir
  getChallengeById: async (id: number) => {
    const response = await api.get(`/match-challenges/${id}`);
    return response.data.data;
  },

  // Challenge'ı kabul et
  acceptChallenge: async (id: number) => {
    const response = await api.put(`/match-challenges/${id}/accept`);
    return response.data.data;
  },

  // Challenge'ı reddet
  rejectChallenge: async (id: number) => {
    const response = await api.put(`/match-challenges/${id}/reject`);
    return response.data.data;
  },

  // Challenge'ı iptal et
  cancelChallenge: async (id: number) => {
    const response = await api.put(`/match-challenges/${id}/cancel`);
    return response.data.data;
  },

  // Challenge'ı sil
  deleteChallenge: async (id: number) => {
    const response = await api.delete(`/match-challenges/${id}`);
    return response.data;
  },
};

export default api;
