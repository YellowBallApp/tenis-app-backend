import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';
import { Platform } from 'react-native';
import { AppState } from 'react-native';

// Logout callback - AuthContext set edecek
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const triggerLogout = () => {
  if (logoutCallback) {
    logoutCallback();
  }
};

// API Base URL yapılandırması
// Production build için: PRODUCTION_API_URL environment variable kullanın
// Ngrok kullanıyorsanız: NGROK_URL değişkenini ayarlayın
// Local network kullanıyorsanız: LOCAL_IP değişkenini ayarlayın
const NGROK_URL = ''; // Örnek: 'https://abc123.ngrok-free.app'
const LOCAL_IP = '192.168.1.115'; // Local WiFi IP'si (gerçek cihaz için)
const EMULATOR_IP = '10.0.2.2'; // Android emülatör için özel IP

// Production API URL - Gerçek telefonda kullanılacak URL
// Bu URL'yi backend'inizin deploy edildiği yere göre ayarlayın
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.115:3000';

// Android emülatörü algıla
const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  try {
    // Platform constants kontrolü
    const constants = Platform.constants as any;
    const brand = (constants?.Brand || constants?.brand || '').toLowerCase();
    const model = (constants?.Model || constants?.model || '').toLowerCase();
    const manufacturer = (constants?.Manufacturer || constants?.manufacturer || '').toLowerCase();
    const fingerprint = (constants?.Fingerprint || constants?.fingerprint || '').toLowerCase();
    
    // Emülatör belirteçleri
    const emulatorIndicators = [
      'google_sdk',
      'sdk',
      'emulator',
      'android sdk',
      'genymotion',
      'unknown',
      'generic',
      'goldfish',
      'ranchu',
    ];
    
    // Tüm alanları kontrol et
    const allFields = `${brand} ${model} ${manufacturer} ${fingerprint}`;
    
    const isEmulator = 
      emulatorIndicators.some(indicator => allFields.includes(indicator)) ||
      model.includes('emulator') ||
      brand === 'unknown' ||
      fingerprint.includes('generic') ||
      fingerprint.includes('unknown');
    
    if (isEmulator) {
      console.log('📱 Emülatör algılama:', { brand, model, manufacturer, fingerprint });
    }
    
    return isEmulator;
  } catch (error) {
    console.warn('Emülatör algılama hatası:', error);
    // Hata durumunda false döndür (güvenli taraf - gerçek cihaz gibi davran)
    return false;
  }
};

const getApiBaseUrl = () => {
  // 1. Ngrok URL varsa onu kullan (farklı ağlardan erişim için)
  if (NGROK_URL) {
    return `${NGROK_URL}/api`;
  }
  
  // 2. Production build için PRODUCTION_API_URL kullan
  // Gerçek telefonda production build çalıştığında bu URL kullanılacak
  if (!__DEV__) {
    const prodUrl = PRODUCTION_API_URL.endsWith('/api') 
      ? PRODUCTION_API_URL 
      : `${PRODUCTION_API_URL}/api`;
    console.log('📱 Production build - API URL:', prodUrl);
    return prodUrl;
  }
  
  // 3. Development build için local IP kullan
  if (Platform.OS === 'android') {
    // Android emülatör kontrolü
    if (isAndroidEmulator()) {
      console.log('📱 Development - Android emülatör algılandı - 10.0.2.2 kullanılıyor');
      return `http://${EMULATOR_IP}:3000/api`;
    } else {
      console.log('📱 Development - Gerçek Android cihaz algılandı - WiFi IP kullanılıyor');
      return `http://${LOCAL_IP}:3000/api`;
    }
  } else {
    // iOS simulator veya gerçek cihaz için
    console.log('📱 Development - iOS/Local cihaz - WiFi IP kullanılıyor');
    return `http://${LOCAL_IP}:3000/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 saniye timeout (backend yavaş yanıt veriyorsa artırıldı)
});

// API base URL'i logla
const isEmulator = Platform.OS === 'android' ? isAndroidEmulator() : false;
console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS, isEmulator ? '(Emülatör)' : '(Gerçek Cihaz)');

// Request interceptor - token ekleme
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // Token'ı temizle (boşluk, satır sonu vs. varsa)
        const cleanToken = token.trim();
        config.headers.Authorization = `Bearer ${cleanToken}`;
        console.log('Request interceptor: Token eklendi', { 
          hasToken: !!cleanToken,
          tokenLength: cleanToken.length,
          url: config.url 
        });
      } else {
        console.log('Request interceptor: Token bulunamadı', { url: config.url });
      }
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor setup error:', error);
    return Promise.reject(error);
  }
);

// Helper function: API response'lardaki boolean değerleri normalize et
// Backend'den string olarak gelebilecek boolean değerleri gerçek boolean'a çevirir
const normalizeBooleanInResponse = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Primitive types
  if (typeof data !== 'object') {
    // String "true"/"false" değerlerini boolean'a çevir
    if (typeof data === 'string') {
      if (data.toLowerCase() === 'true') return true;
      if (data.toLowerCase() === 'false') return false;
    }
    return data;
  }
  
  // Array
  if (Array.isArray(data)) {
    return data.map(item => normalizeBooleanInResponse(item));
  }
  
  // Object - tüm property'leri recursive olarak normalize et
  const normalized: any = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      // Bilinen boolean field'ları özel olarak normalize et
      if (key === 'closed' || key === 'indoors' || key === 'isPinned' || 
          key === 'isRainy' || key === 'isSnowy' || key === 'isIndoor' ||
          key === 'isOutdoor' || key === 'affectsEloRating') {
        // String "true"/"false" kontrolü
        if (typeof value === 'string') {
          normalized[key] = value.toLowerCase() === 'true';
        } else {
          // Primitive boolean'a çevir (Boolean() değil, !! kullan)
          normalized[key] = !!value;
        }
      } else {
        normalized[key] = normalizeBooleanInResponse(value);
      }
    }
  }
  
  return normalized;
};

// Response interceptor - token refresh, error handling ve boolean normalization
api.interceptors.response.use(
  (response) => {
    // API response'daki boolean değerleri normalize et
    if (response.data && response.data.data) {
      response.data.data = normalizeBooleanInResponse(response.data.data);
    } else if (response.data) {
      response.data = normalizeBooleanInResponse(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Network hatası kontrolü
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        url: originalRequest?.url,
      });
      
      // Token varsa ama network hatası alınıyorsa, logout yap
      const hasToken = await AsyncStorage.getItem('accessToken');
      if (hasToken && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
        console.log('Token var ama servis çalışmıyor - logout yapılıyor');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        triggerLogout();
      }
      
      // Network hatası için daha açıklayıcı mesaj
      const networkError = new Error(
        error.message || 'Network error. Please check your internet connection.'
      );
      return Promise.reject(networkError);
    }
    
    // Token expired veya unauthorized durumunda
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('Access token expired, refreshing...');
          
          // Refresh token isteği için axios kullan (interceptor olmadan)
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken: refreshToken.trim() },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (response.data?.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            await AsyncStorage.setItem('accessToken', accessToken.trim());
            await AsyncStorage.setItem('refreshToken', newRefreshToken.trim());
            
            console.log('Token refreshed successfully');
            // Yeni access token ile tekrar dene
            originalRequest.headers.Authorization = `Bearer ${accessToken.trim()}`;
            return api(originalRequest);
          } else {
            throw new Error('Invalid refresh token response');
          }
        } else {
          console.log('No refresh token found - logout yapılıyor');
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          triggerLogout();
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      } catch (refreshError: any) {
        // Refresh token da geçersiz, kullanıcıyı logout yap
        console.error('Refresh token failed - logout yapılıyor:', {
          error: refreshError.message,
          response: refreshError.response?.data,
        });
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        triggerLogout();
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }
    
    // 403 Forbidden - token geçersiz veya yetkisiz
    if (error.response?.status === 403) {
      const hasToken = await AsyncStorage.getItem('accessToken');
      if (hasToken) {
        console.log('403 Forbidden - token geçersiz, logout yapılıyor');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        triggerLogout();
      }
    }
    
    // CHALLENGE_NOT_FOUND gibi normal durumlar için sessizce handle et
    // Backend'den gelen hata yapısı: {data: {errorKey, errorCode, message}, status: 400}
    const errorData = error.response?.data?.data || error.response?.data;
    const errorKey = errorData?.errorKey;
    const isChallengeEndpoint = originalRequest?.url?.includes('/match-challenges/');
    const isChallengeNotFound = errorKey === 'CHALLENGE_NOT_FOUND' || 
                                (error.response?.status === 400 && isChallengeEndpoint);
    
    // Challenge not found hatası normal bir durum (challenge silinmiş/süresi dolmuş olabilir)
    // Bu durumda sessizce reject et, console.error log'lamayı atla
    if (isChallengeNotFound && isChallengeEndpoint) {
      // Sessizce reject et, log'lamayı atla (challenge bulunamadığı normal bir durum)
      return Promise.reject(error);
    }
    
    // Diğer HTTP hataları için detaylı log
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: originalRequest?.url,
    });
    
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
    age?: number;
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

export const coachReviewService = {
  // Antrenöre review oluştur
  createReview: async (coachId: string, rating: number, comment: string) => {
    const response = await api.post('/coach-reviews', {
      coachId,
      rating,
      comment,
    });
    return response.data.data;
  },

  // Antrenörün tüm review'larını getir
  getCoachReviews: async (coachId: string) => {
    const response = await api.get(`/coach-reviews/coach/${coachId}`);
    return response.data.data;
  },

  // Kullanıcının review'ını güncelle
  updateReview: async (reviewId: number, rating: number, comment: string) => {
    const response = await api.put(`/coach-reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data.data;
  },

  // Review sil
  deleteReview: async (reviewId: number) => {
    const response = await api.delete(`/coach-reviews/${reviewId}`);
    return response.data;
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

  // Kullanıcının maç istatistiklerini getir
  getUserMatchStats: async (userId: string) => {
    const response = await api.get(`/match-history/user/${userId}/stats`);
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

// Weather Service
export const weatherService = {
  // Cache'den 7 günlük hava durumu tahminini getirir
  getWeatherForecast: async (location: string = 'izmir') => {
    const response = await api.get(`/weather/forecast?location=${location}`);
    return response.data.data;
  },

  // Belirli bir tarih ve saat için hava durumu bilgisini getirir
  getWeatherForDateTime: async (date: string, time: string, location: string = 'izmir') => {
    const response = await api.get(`/weather/for-datetime?date=${date}&time=${time}&location=${location}`);
    return response.data.data;
  },
};

export default api;
