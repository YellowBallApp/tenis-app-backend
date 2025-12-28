import axios from 'axios';

// API Base URL yapılandırması
// Kolay test için environment variable'larla kontrol edilebilir
const DEFAULT_PORT = 3000;
const DEFAULT_PRODUCTION_IP = '213.238.172.217'; // Frontend'deki aynı production IP

// Environment variable'lar
const VITE_API_URL = import.meta.env.VITE_API_URL; // Tam URL (http://... veya https://...)
const VITE_API_MODE = import.meta.env.VITE_API_MODE; // 'development' | 'production' | 'local' | 'server'
const VITE_NGROK_URL = import.meta.env.VITE_NGROK_URL; // Ngrok URL
const VITE_PRODUCTION_IP = import.meta.env.VITE_PRODUCTION_IP || DEFAULT_PRODUCTION_IP;

// Vite'ın build modu (npm run dev = development, npm run build = production)
const isViteDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * API Base URL'ini belirler
 * Öncelik sırası:
 * 1. VITE_API_URL (tam URL belirtilmişse - en yüksek öncelik)
 * 2. VITE_API_MODE='development' veya 'local' -> localhost:3000/api
 * 3. VITE_API_MODE='production' veya 'server' -> production IP:3000/api
 * 4. VITE_NGROK_URL (ngrok kullanılıyorsa)
 * 5. Vite build modu (development -> localhost, production -> server IP)
 */
function getApiBaseUrl(): string {
  // 1. Tam URL belirtilmişse (http://... veya https://... ile başlıyorsa) onu kullan (EN YÜKSEK ÖNCELİK)
  if (VITE_API_URL && (VITE_API_URL.startsWith('http://') || VITE_API_URL.startsWith('https://'))) {
    const url = VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL}/api`;
    console.log('🔧 API URL (VITE_API_URL):', url);
    return url;
  }

  // 2. VITE_API_MODE ile manuel kontrol (KOLAY TEST İÇİN)
  if (VITE_API_MODE) {
    const mode = VITE_API_MODE.toLowerCase();
    if (mode === 'development' || mode === 'local') {
      const devUrl = `http://localhost:${DEFAULT_PORT}/api`;
      console.log('🔧 API URL (VITE_API_MODE=development/local):', devUrl);
      return devUrl;
    }
    if (mode === 'production' || mode === 'server') {
      const prodUrl = `https://${VITE_PRODUCTION_IP}:${DEFAULT_PORT}/api`;
      console.log('📱 API URL (VITE_API_MODE=production/server):', prodUrl);
      return prodUrl;
    }
  }

  // 3. Ngrok URL varsa onu kullan
  if (VITE_NGROK_URL) {
    const ngrokUrl = VITE_NGROK_URL.endsWith('/api') 
      ? VITE_NGROK_URL 
      : `${VITE_NGROK_URL}/api`;
    console.log('🔗 API URL (Ngrok):', ngrokUrl);
    return ngrokUrl;
  }

  // 4. Vite build moduna göre otomatik seçim (fallback)
  if (isViteDevelopment) {
    const devUrl = `http://localhost:${DEFAULT_PORT}/api`;
    console.log('🔧 API URL (Vite Development Mode):', devUrl);
    return devUrl;
  } else {
    const prodUrl = `https://${VITE_PRODUCTION_IP}:${DEFAULT_PORT}/api`;
    console.log('📱 API URL (Vite Production Mode):', prodUrl);
    return prodUrl;
  }
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 durumunda logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_accessToken');
      localStorage.removeItem('admin_refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

