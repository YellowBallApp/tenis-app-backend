import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';
import { Platform } from 'react-native';
import { AppState } from 'react-native';

// NetInfo sadece native platformlarda kullanılabilir
let NetInfo: any = null;
if (Platform.OS !== 'web') {
  try {
    NetInfo = require('@react-native-community/netinfo').default;
  } catch (e) {
    console.warn('NetInfo yüklenemedi:', e);
  }
}

// AsyncStorage key'leri
const CACHED_SERVER_IP_KEY = '@cached_server_ip';

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
const NGROK_URL = process.env.EXPO_PUBLIC_NGROK_URL || ''; // Örnek: 'https://abc123.ngrok-free.app'
const EMULATOR_IP = process.env.EXPO_PUBLIC_EMULATOR_IP || '10.0.2.2'; // Android emülatör için özel IP
const DEFAULT_PORT = parseInt(process.env.EXPO_PUBLIC_API_PORT || '3000', 10);

// Production API URL - Gerçek telefonda kullanılacak URL
// Bu URL'yi backend'inizin deploy edildiği yere göre ayarlayın
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Default production server IP - Build alındığında kullanılacak IP
const DEFAULT_PRODUCTION_IP = '213.238.172.217';

// Yaygın local network IP aralıkları (fallback için)
const COMMON_IP_RANGES = [
  '192.168.1', // En yaygın ev ağı
  '192.168.0',
  '10.0.0',
  '172.16.0',
];

/**
 * Backend'den server IP'sini alır (cache'lenmiş veya yeni)
 * Environment variable varsa onu kullan, yoksa default production IP kullanılır
 */
async function getServerIP(): Promise<string | null> {
  try {
    // Environment variable'dan IP al, yoksa default production IP kullan
    const serverIP = process.env.EXPO_PUBLIC_SERVER_IP || DEFAULT_PRODUCTION_IP;
    if (__DEV__) {
      console.log('🔧 Development - Server IP:', serverIP);
    } else {
      console.log('📱 Production - Server IP:', serverIP);
    }
    return serverIP;
  } catch (error) {
    console.error('❌ Server IP alınırken hata:', error);
    return null;
  }
}

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

// Cache'lenmiş server IP
let cachedServerIP: string | null = null;
let isDiscoveringIP = false;

/**
 * Server IP'sini dinamik olarak alır veya cache'den döndürür
 */
async function getCachedOrDiscoverServerIP(): Promise<string | null> {
  // Eğer cache'de varsa, önce onu döndür
  if (cachedServerIP) {
    return cachedServerIP;
  }
  
  // Zaten discovery yapılıyorsa bekle
  if (isDiscoveringIP) {
    // Kısa bir süre bekle (max 5 saniye)
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (cachedServerIP) return cachedServerIP;
    }
    return null;
  }
  
  // IP discovery başlat
  isDiscoveringIP = true;
  try {
    const ip = await getServerIP();
    cachedServerIP = ip;
    return ip;
  } finally {
    isDiscoveringIP = false;
  }
}

const getApiBaseUrl = async (): Promise<string> => {
  // 1. Ngrok URL varsa onu kullan (farklı ağlardan erişim için)
  if (NGROK_URL) {
    return `${NGROK_URL}/api`;
  }

  // 2. Production build için (APK'da) direkt default production IP kullan
  // Gerçek telefonda production build çalıştığında bu IP kullanılacak
  if (!__DEV__) {
    if (PRODUCTION_API_URL) {
      const prodUrl = PRODUCTION_API_URL.endsWith('/api') 
        ? PRODUCTION_API_URL 
        : `${PRODUCTION_API_URL}/api`;
      console.log('📱 Production build - API URL:', prodUrl);
      return prodUrl;
    }
    // Production'da direkt default production IP'yi kullan (APK için)
    const serverIP = process.env.EXPO_PUBLIC_SERVER_IP || DEFAULT_PRODUCTION_IP;
    const apiUrl = `http://${serverIP}:${DEFAULT_PORT}/api`;
    console.log('📱 Production build (APK) - API URL:', apiUrl);
    return apiUrl;
  }

  // 3. Development build için
  // Development modunda backend'e localhost üzerinden bağlan
  // Android emülatörde ise özel IP (10.0.2.2) kullanılır
  if (__DEV__) {
    let devHost = 'localhost';

    if (Platform.OS === 'android' && isAndroidEmulator()) {
      devHost = EMULATOR_IP || '10.0.2.2';
    }

    const devUrl = `http://${devHost}:${DEFAULT_PORT}/api`;
    console.log('🔧 Development build - API URL:', devUrl, '(Platform:', Platform.OS, ')');
    return devUrl;
  }

  // Güvenli fallback: yine production IP'yi kullan
  console.warn(`⚠️ Beklenmeyen durum - default production IP kullanılıyor: ${DEFAULT_PRODUCTION_IP}`);
  return `http://${DEFAULT_PRODUCTION_IP}:${DEFAULT_PORT}/api`;
};

// İlk başta base URL'i al (async)
// Development'ta localhost / emülatör IP'si, production'da ise production IP kullan
const fallbackHost =
  __DEV__
    ? (Platform.OS === 'android' && isAndroidEmulator()
        ? (EMULATOR_IP || '10.0.2.2')
        : 'localhost')
    : (process.env.EXPO_PUBLIC_FALLBACK_HOST || DEFAULT_PRODUCTION_IP);

let API_BASE_URL: string = `http://${fallbackHost}:${DEFAULT_PORT}/api`;

// Önceki ağ durumunu takip et
let previousNetworkType: string | null = null;
let previousNetworkSSID: string | null = null;

// API başlatma durumu
let isAPIInitialized = false;
let apiInitializationPromise: Promise<void> | null = null;

/**
 * API'yi başlatır - IP keşfi yapar ve network listener'ı kurar
 * Uygulama başlatılırken bu fonksiyon await edilmelidir
 */
export const initializeAPI = async (): Promise<void> => {
  // Eğer zaten başlatılmışsa, tekrar başlatma
  if (isAPIInitialized) {
    return;
  }
  
  // Eğer başlatma devam ediyorsa, aynı promise'i döndür
  if (apiInitializationPromise) {
    return apiInitializationPromise;
  }
  
  // Başlatma promise'ini oluştur
  apiInitializationPromise = (async () => {
    try {
      console.log('🚀 API başlatılıyor - IP keşfi başlıyor...');
      API_BASE_URL = await getApiBaseUrl();
      console.log('✅ API başlatıldı - Base URL:', API_BASE_URL);
      
      // İlk ağ durumunu kaydet (sadece native platformlarda)
      if (NetInfo && Platform.OS !== 'web') {
        try {
          const netInfoState = await NetInfo.fetch();
          previousNetworkType = netInfoState.type;
          previousNetworkSSID = (netInfoState as any).details?.ssid || null;
          console.log('📡 İlk ağ durumu:', { type: previousNetworkType, ssid: previousNetworkSSID });
        } catch (error) {
          console.warn('NetInfo fetch hatası:', error);
        }
      }
      
      isAPIInitialized = true;
    } catch (error) {
      console.error('❌ API başlatma hatası:', error);
      // Hata olsa bile localhost ile devam et
      isAPIInitialized = true;
    }
  })();
  
  return apiInitializationPromise;
};

// Ağ değişikliği listener'ı - Ağ değiştiğinde IP cache'ini temizle (sadece native platformlarda)
if (NetInfo && Platform.OS !== 'web') {
  NetInfo.addEventListener(async (state: any) => {
  const currentNetworkType = state.type;
  const currentNetworkSSID = (state as any).details?.ssid || null;
  
  // Ağ bağlantısı yoksa
  if (!state.isConnected) {
    console.log('❌ Ağ bağlantısı kesildi');
    return;
  }
  
  // İlk başlatmayı atla
  if (previousNetworkType === null) {
    previousNetworkType = currentNetworkType;
    previousNetworkSSID = currentNetworkSSID;
    return;
  }
  
  // Ağ tipi değiştiyse (WiFi → Cellular veya tersi)
  const networkTypeChanged = currentNetworkType !== previousNetworkType;
  
  // WiFi SSID değiştiyse (farklı WiFi'ya bağlanıldı)
  const ssidChanged = currentNetworkType === 'wifi' && 
                      currentNetworkSSID !== previousNetworkSSID &&
                      currentNetworkSSID !== null;
  
  if (networkTypeChanged || ssidChanged) {
    console.log('🔄 Ağ değişikliği algılandı!', {
      önceki: { type: previousNetworkType, ssid: previousNetworkSSID },
      şimdiki: { type: currentNetworkType, ssid: currentNetworkSSID }
    });
    
    // IP cache'ini temizle
    console.log('🧹 IP cache temizleniyor...');
    await AsyncStorage.removeItem(CACHED_SERVER_IP_KEY);
    cachedServerIP = null;
    
    // Yeni IP keşfi başlat (arka planda)
    console.log('🔍 Yeni IP keşfi başlatılıyor...');
    getApiBaseUrl()
      .then((newBaseUrl) => {
        API_BASE_URL = newBaseUrl;
        console.log('✅ Yeni API Base URL:', API_BASE_URL);
      })
      .catch((error) => {
        console.error('❌ Yeni IP keşfi başarısız:', error);
      });
    
    // Önceki durumu güncelle
    previousNetworkType = currentNetworkType;
    previousNetworkSSID = currentNetworkSSID;
  }
  });
}

const api = axios.create({
  // baseURL'i interceptor'da dinamik olarak ayarlayacağız
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 saniye timeout (backend yavaş yanıt veriyorsa artırıldı)
});

// API base URL'i logla
const isEmulator = Platform.OS === 'android' ? isAndroidEmulator() : false;
console.log('Platform:', Platform.OS, isEmulator ? '(Emülatör)' : '(Gerçek Cihaz)');

// Client IP ve device bilgilerini al
async function getClientInfo(): Promise<{
  clientIP: string | null;
  deviceType: string;
  isEmulator: boolean;
  platform: string;
  networkType: string | null;
}> {
  let clientIP: string | null = null;
  let networkType: string | null = null;
  
  try {
    if (NetInfo && Platform.OS !== 'web') {
      const netInfoState = await NetInfo.fetch();
      networkType = netInfoState.type;
      
      // Client IP'yi al (WiFi veya cellular)
      if (netInfoState.type === 'wifi' && netInfoState.details) {
        clientIP = (netInfoState.details as any).ipAddress || null;
      } else if (netInfoState.type === 'cellular' && netInfoState.details) {
        clientIP = (netInfoState.details as any).ipAddress || null;
      }
    }
  } catch (error) {
    console.warn('Client IP alınırken hata:', error);
  }
  
  return {
    clientIP: clientIP || 'unknown',
    deviceType: Platform.OS,
    isEmulator: Platform.OS === 'android' ? isAndroidEmulator() : false,
    platform: `${Platform.OS} ${Platform.Version || ''}`.trim(),
    networkType: networkType || 'unknown',
  };
}

// Request interceptor - baseURL, token ve detaylı log ekleme
api.interceptors.request.use(
  async (config) => {
    try {
      const timestamp = new Date().toISOString();
      
      // API henüz başlatılmadıysa, önce başlat
      if (!isAPIInitialized) {
        console.log('⏳ API henüz başlatılmadı, başlatılıyor...');
        await initializeAPI();
      }
      
      // BaseURL'i dinamik olarak ayarla
      if (!config.baseURL) {
        const baseUrl = await getApiBaseUrl();
        config.baseURL = baseUrl;
      }
      
      // Client bilgilerini al
      const clientInfo = await getClientInfo();
      
      // Token ekle
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // Token'ı temizle (boşluk, satır sonu vs. varsa)
        const cleanToken = token.trim();
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
      
      // Backend'e gönderilecek client bilgilerini header olarak ekle
      config.headers['X-Client-IP'] = clientInfo.clientIP || 'unknown';
      config.headers['X-Client-Platform'] = clientInfo.platform;
      config.headers['X-Client-Device-Type'] = clientInfo.deviceType;
      config.headers['X-Client-Is-Emulator'] = String(clientInfo.isEmulator);
      config.headers['X-Client-Network-Type'] = clientInfo.networkType || 'unknown';
      config.headers['X-Request-Timestamp'] = timestamp;
      
      // Full URL'yi oluştur
      const fullUrl = `${config.baseURL}${config.url}`;
      
      // Detaylı log - Frontend console'da
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 API REQUEST GÖNDERİLİYOR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🕐 Timestamp:', timestamp);
      console.log('🌐 Target Server URL:', config.baseURL);
      console.log('📍 Endpoint:', config.url);
      console.log('🔗 Full URL:', fullUrl);
      console.log('📋 Method:', config.method?.toUpperCase() || 'GET');
      console.log('📱 Client IP:', clientInfo.clientIP || 'unknown');
      console.log('💻 Platform:', clientInfo.platform);
      console.log('📲 Device Type:', clientInfo.deviceType);
      console.log('🎮 Is Emulator:', clientInfo.isEmulator ? 'Yes' : 'No');
      console.log('📡 Network Type:', clientInfo.networkType || 'unknown');
      console.log('🔑 Has Token:', token ? 'Yes' : 'No');
      if (config.params) {
        console.log('📦 Query Params:', JSON.stringify(config.params, null, 2));
      }
      if (config.data) {
        const dataStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 2);
        console.log('📨 Request Body:', dataStr.substring(0, 500) + (dataStr.length > 500 ? '...' : ''));
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Backend'de görülebilmesi için structured log (JSON formatında)
      const logData = {
        type: 'API_REQUEST',
        timestamp,
        method: config.method?.toUpperCase() || 'GET',
        endpoint: config.url,
        baseURL: config.baseURL,
        fullURL: fullUrl,
        clientIP: clientInfo.clientIP,
        platform: clientInfo.platform,
        deviceType: clientInfo.deviceType,
        isEmulator: clientInfo.isEmulator,
        networkType: clientInfo.networkType,
        hasToken: !!token,
        params: config.params || null,
        bodySize: config.data ? (typeof config.data === 'string' ? config.data.length : JSON.stringify(config.data).length) : 0,
      };
      console.log('📊 Structured Log:', JSON.stringify(logData, null, 2));
      
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor setup error:', error);
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
    const timestamp = new Date().toISOString();
    const requestUrl = response.config.url || 'unknown';
    const baseURL = response.config.baseURL || 'unknown';
    const fullUrl = `${baseURL}${requestUrl}`;
    const method = response.config.method?.toUpperCase() || 'GET';
    const status = response.status;
    const statusText = response.statusText;
    
    // API response'daki boolean değerleri normalize et
    if (response.data && response.data.data) {
      response.data.data = normalizeBooleanInResponse(response.data.data);
    } else if (response.data) {
      response.data = normalizeBooleanInResponse(response.data);
    }
    
    // Detaylı log - Başarılı yanıt
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API RESPONSE ALINDI (BAŞARILI)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🕐 Timestamp:', timestamp);
    console.log('🌐 Target Server URL:', baseURL);
    console.log('📍 Endpoint:', requestUrl);
    console.log('🔗 Full URL:', fullUrl);
    console.log('📋 Method:', method);
    console.log('✅ Status:', status, statusText);
    console.log('⏱️  Response Time:', response.headers['x-response-time'] || 'N/A');
    if (response.data) {
      const dataStr = JSON.stringify(response.data, null, 2);
      console.log('📥 Response Data:', dataStr.substring(0, 500) + (dataStr.length > 500 ? '...' : ''));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Structured log
    const logData = {
      type: 'API_RESPONSE_SUCCESS',
      timestamp,
      method,
      endpoint: requestUrl,
      baseURL,
      fullURL: fullUrl,
      status,
      statusText,
      responseTime: response.headers['x-response-time'] || null,
      dataSize: response.data ? JSON.stringify(response.data).length : 0,
    };
    console.log('📊 Structured Log:', JSON.stringify(logData, null, 2));
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const timestamp = new Date().toISOString();
    
    // Network hatası kontrolü
    if (!error.response) {
      const baseUrl = originalRequest?.baseURL || API_BASE_URL;
      const fullUrl = originalRequest?.url ? `${baseUrl}${originalRequest.url}` : 'Unknown URL';
      const method = originalRequest?.method?.toUpperCase() || 'GET';
      
      // Detaylı log - Network hatası
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ API RESPONSE HATASI (NETWORK)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🕐 Timestamp:', timestamp);
      console.log('🌐 Target Server URL:', baseUrl);
      console.log('📍 Endpoint:', originalRequest?.url || 'unknown');
      console.log('🔗 Full URL:', fullUrl);
      console.log('📋 Method:', method);
      console.log('❌ Error Code:', error.code || 'UNKNOWN');
      console.log('❌ Error Message:', error.message);
      console.log('⏱️  Timeout:', error.code === 'ECONNABORTED' ? 'Yes' : 'No');
      console.log('📡 Network Error:', error.code === 'ERR_NETWORK' ? 'Yes' : 'No');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Structured log
      const logData = {
        type: 'API_RESPONSE_ERROR_NETWORK',
        timestamp,
        method,
        endpoint: originalRequest?.url || 'unknown',
        baseURL: baseUrl,
        fullURL: fullUrl,
        errorCode: error.code || 'UNKNOWN',
        errorMessage: error.message,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.code === 'ERR_NETWORK',
      };
      console.log('📊 Structured Log:', JSON.stringify(logData, null, 2));
      
      // Token varsa ama network hatası alınıyorsa, logout yapma
      // Çünkü bu backend bağlantı sorunu olabilir, token sorunu değil
      const hasToken = await AsyncStorage.getItem('accessToken');
      
      // Network hatası için daha açıklayıcı mesaj
      let errorMessage = 'Network error. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += `Request timeout. Backend server at ${baseUrl} may be slow or unreachable.`;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += `Backend sunucusuna bağlanılamıyor: ${baseUrl}\n\nLütfen kontrol edin:\n- Backend sunucusu çalışıyor mu? (port ${DEFAULT_PORT})\n- IP adresi doğru mu?\n- Ağ bağlantısı aktif mi?`;
      } else {
        errorMessage += error.message || `Please check your connection to ${baseUrl}`;
      }
      
      const networkError = new Error(errorMessage);
      // Error objesine ekstra bilgi ekle
      (networkError as any).code = error.code;
      (networkError as any).url = fullUrl;
      (networkError as any).baseURL = baseUrl;
      
      // Network error durumunda cache'i temizle (yeniden IP araması için)
      if (error.code === 'ERR_NETWORK') {
        console.log('🔄 Network error - IP cache temizleniyor...');
        await AsyncStorage.removeItem(CACHED_SERVER_IP_KEY);
        cachedServerIP = null;
      }
      
      return Promise.reject(networkError);
    }
    
    // Token expired veya unauthorized durumunda
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const baseUrl = originalRequest?.baseURL || API_BASE_URL;
      const fullUrl = originalRequest?.url ? `${baseUrl}${originalRequest.url}` : 'Unknown URL';
      const method = originalRequest?.method?.toUpperCase() || 'GET';
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 API RESPONSE: 401 UNAUTHORIZED - Token yenileniyor');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🕐 Timestamp:', timestamp);
      console.log('🌐 Target Server URL:', baseUrl);
      console.log('📍 Endpoint:', originalRequest?.url || 'unknown');
      console.log('🔗 Full URL:', fullUrl);
      console.log('📋 Method:', method);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('🔄 Access token expired, refreshing...');
          
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
      const baseUrl = originalRequest?.baseURL || API_BASE_URL;
      const fullUrl = originalRequest?.url ? `${baseUrl}${originalRequest.url}` : 'Unknown URL';
      const method = originalRequest?.method?.toUpperCase() || 'GET';
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚫 API RESPONSE: 403 FORBIDDEN - Token geçersiz');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🕐 Timestamp:', timestamp);
      console.log('🌐 Target Server URL:', baseUrl);
      console.log('📍 Endpoint:', originalRequest?.url || 'unknown');
      console.log('🔗 Full URL:', fullUrl);
      console.log('📋 Method:', method);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const hasToken = await AsyncStorage.getItem('accessToken');
      if (hasToken) {
        console.log('🚪 403 Forbidden - token geçersiz, logout yapılıyor');
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
    
    // Hava durumu için 404 hataları normaldir (cache'de veri yoksa), sessizce handle et
    const isWeatherEndpoint = originalRequest?.url?.includes('/weather/for-datetime');
    if (isWeatherEndpoint && error.response?.status === 404) {
      // Hava durumu için 404 normal bir durum, sessizce reject et (log'lamayı atla)
      return Promise.reject(error);
    }
    
    // HTTP hata yanıtları için detaylı log
    if (error.response) {
      const baseUrl = originalRequest?.baseURL || API_BASE_URL;
      const fullUrl = originalRequest?.url ? `${baseUrl}${originalRequest.url}` : 'Unknown URL';
      const method = originalRequest?.method?.toUpperCase() || 'GET';
      const status = error.response.status;
      const statusText = error.response.statusText;
      const errorData = error.response.data;
      
      // Detaylı log - HTTP hata yanıtı
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ API RESPONSE HATASI (HTTP)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🕐 Timestamp:', timestamp);
      console.log('🌐 Target Server URL:', baseUrl);
      console.log('📍 Endpoint:', originalRequest?.url || 'unknown');
      console.log('🔗 Full URL:', fullUrl);
      console.log('📋 Method:', method);
      console.log('❌ Status:', status, statusText);
      console.log('📨 Error Data:', errorData ? JSON.stringify(errorData, null, 2).substring(0, 500) : 'No error data');
      if (errorData?.data?.errorKey) {
        console.log('🔑 Error Key:', errorData.data.errorKey);
      }
      if (errorData?.data?.message) {
        console.log('💬 Error Message:', errorData.data.message);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Structured log
      const logData = {
        type: 'API_RESPONSE_ERROR_HTTP',
        timestamp,
        method,
        endpoint: originalRequest?.url || 'unknown',
        baseURL: baseUrl,
        fullURL: fullUrl,
        status,
        statusText,
        errorKey: errorData?.data?.errorKey || null,
        errorMessage: errorData?.data?.message || errorData?.message || null,
        errorData: errorData || null,
      };
      console.log('📊 Structured Log:', JSON.stringify(logData, null, 2));
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
    age?: number;
  }): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/user/profile', profileData);
    return response.data.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.post('/user/change-password', passwordData);
  },
};

export const userService = {
  // Tüm kullanıcıları getir (Members screen için)
  getAllUsers: async () => {
    const response = await api.get('/user/all');
    return response.data.data;
  },

  // Belirli bir kullanıcıyı ID'ye göre getir
  getUserById: async (userId: string) => {
    const response = await api.get(`/user/${userId}`);
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

  // Antrenörün tüm review'larını getir (sadece onaylı yorumlar)
  getCoachReviews: async (coachId: string) => {
    const response = await api.get(`/coach-reviews/coach/${coachId}?onlyApproved=true`);
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

export const memberReviewService = {
  // Üyeye review oluştur
  createReview: async (memberId: string, rating: number, comment: string) => {
    const response = await api.post('/member-reviews', {
      memberId,
      rating,
      comment,
    });
    return response.data.data;
  },

  // Üyenin tüm review'larını getir (tüm yorumlar - hem onaylı hem bekleyen)
  getMemberReviews: async (memberId: string) => {
    const response = await api.get(`/member-reviews/member/${memberId}?onlyApproved=false`);
    console.log('📥 Üye yorumları API yanıtı:', response.data);
    return response.data.data;
  },

  // Kullanıcının review'ını güncelle
  updateReview: async (reviewId: number, rating: number, comment: string) => {
    const response = await api.put(`/member-reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data.data;
  },

  // Review sil
  deleteReview: async (reviewId: number) => {
    const response = await api.delete(`/member-reviews/${reviewId}`);
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
        } catch (error: any) {
          // 404 veya 400 hatası ise sadece logla, 500 ise daha detaylı logla
          if (error.response?.status === 404 || error.response?.status === 400) {
            console.warn(`League ${league.id} için settings bulunamadı (otomatik oluşturulacak)`);
          } else {
            console.error(`League ${league.id} settings fetch error:`, error);
          }
          // Settings olmadan da league'i döndür
          return {
            ...league,
            settings: null
          };
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

  // Kullanıcıyı lige ekle (DEPRECATED - use leagueApplicationService instead)
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

  // Kullanıcının aktif rezervasyonu var mı kontrol et
  hasActiveReservation: async () => {
    const response = await api.get('/reservations/has-active');
    return response.data.data.hasActive;
  },

  // Yeni rezervasyon oluştur
  createReservation: async (data: {
    courtId: number;
    startTime: string;
    endTime: string;
    participantIds?: string[];
    notes?: string;
  }) => {
    const response = await api.post('/reservations', data);
    return response.data.data;
  },

  // ID'ye göre rezervasyon getir
  getReservationById: async (reservationId: number) => {
    const response = await api.get(`/reservations/${reservationId}`);
    return response.data.data;
  },

  // Rezervasyon iptal et
  cancelReservation: async (reservationId: number) => {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  },

  // Belirli bir kort ve tarih için bloke edilmiş saatleri getir (public endpoint)
  getBlockedHours: async (courtId: number, date: string) => {
    const response = await api.get('/reservations/blocked-hours', { 
      params: { courtId, date } 
    });
    return response.data.data || [];
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

  // Yeni maç geçmişi oluştur
  createMatch: async (data: {
    winnerIds: string[];
    loserIds: string[];
    score: string;
    matchDate?: Date;
    leagueStandingId?: number;
    indoorCourt?: boolean;
    courtGround?: 'grass' | 'clay' | 'hard';
    courtId?: number;
  }) => {
    const response = await api.post('/match-history', data);
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

  // Related entity'ye göre notification'ları sil (rezervasyon için)
  deleteByRelatedEntity: async (relatedEntityId: number, relatedEntityType: string) => {
    const response = await api.delete('/notifications/delete-by-related-entity', {
      params: { 
        relatedEntityId: String(relatedEntityId), 
        relatedEntityType 
      },
    });
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

// Reservation Time Slot Service
export const reservationTimeSlotService = {
  // Aktif saat dilimlerini getir (public endpoint)
  getActiveTimeSlots: async () => {
    const response = await api.get('/reservation-time-slots/active');
    return response.data.data.map((slot: any) => slot.time);
  },
};

// Shield Service (Kullanıcı Koruma Hakkı)
export const shieldService = {
  // Koruma hakkını aktif et
  activateShield: async (leagueId: number, days: number) => {
    const response = await api.post('/shield/activate', { leagueId, days });
    return response.data;
  },

  // Koruma durumunu getir
  getShieldStatus: async (leagueId: number) => {
    const response = await api.get(`/shield/status/${leagueId}`);
    return response.data.data;
  },
};

// Reservation Template Service
export const leagueApplicationService = {
  // Lige başvur
  createApplication: async (leagueId: number, notes?: string) => {
    const response = await api.post('/league-applications', { leagueId, notes });
    return response.data;
  },

  // Kullanıcının başvurularını getir
  getUserApplications: async () => {
    const response = await api.get('/league-applications/my-applications');
    return response.data.data || [];
  },

  // Belirli bir lige ait başvuruyu kontrol et
  checkApplication: async (leagueId: number) => {
    const applications = await leagueApplicationService.getUserApplications();
    return applications.find((app: any) => app.league.id === leagueId);
  },
};

export const reservationTemplateService = {
  // Belirli bir gün için aktif saat dilimlerini getir (public endpoint)
  getActiveTimeSlotsForDay: async (dayOfWeek: number) => {
    const response = await api.get(`/reservation-templates/day/${dayOfWeek}/active`);
    return response.data.data;
  },
};

// Manuel IP adresi ayarlama
export const setManualServerIP = async (ip: string): Promise<void> => {
  try {
    // IP formatını kontrol et
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      throw new Error('Geçersiz IP adresi formatı');
    }
    
    // Cache'e kaydet
    await AsyncStorage.setItem(CACHED_SERVER_IP_KEY, ip);
    cachedServerIP = ip;
    API_BASE_URL = `http://${ip}:${DEFAULT_PORT}/api`;
    
    console.log('✅ Manuel IP ayarlandı:', ip);
  } catch (error) {
    console.error('❌ Manuel IP ayarlama hatası:', error);
    throw error;
  }
};

// Sunucu bağlantısı kontrolü
export const checkServerConnection = async (ip?: string): Promise<{
  connected: boolean;
  serverUrl?: string;
  error?: string;
}> => {
  try {
    const testIP = ip || cachedServerIP;
    if (!testIP) {
      throw new Error('IP adresi belirtilmedi');
    }
    
    const testUrl = `http://${testIP}:${DEFAULT_PORT}/api/server-info`;
    const response = await axios.get(testUrl, { timeout: 3000 });
    
    if (response.data?.data?.ip) {
      console.log('✅ Sunucu bağlantısı başarılı:', testIP);
      return {
        connected: true,
        serverUrl: `http://${testIP}:${DEFAULT_PORT}/api`,
      };
    }
    
    throw new Error('Server response invalid');
  } catch (error: any) {
    console.error('❌ Sunucu bağlantısı başarısız:', error.message);
    return {
      connected: false,
      error: error.message || 'Sunucuya bağlanılamıyor',
    };
  }
};

// Cache temizleme
export const clearServerCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(CACHED_SERVER_IP_KEY);
  cachedServerIP = null;
  console.log('🧹 Sunucu cache temizlendi');
};

export default api;
