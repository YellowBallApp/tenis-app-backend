// API Bağlantı Test Utility
// Telefonda backend'e bağlantıyı test etmek için

import axios from 'axios';

export const testBackendConnection = async (baseUrl: string) => {
  try {
    console.log(`🔍 Testing connection to: ${baseUrl}`);
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    console.log('✅ Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Connection timeout - Backend might not be running');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused - Check if backend is running on correct port');
    } else if (error.code === 'ENETUNREACH') {
      console.error('📡 Network unreachable - Check WiFi connection');
    }
    return { success: false, error: error.message };
  }
};

// Bilgisayarın IP adresini bulmak için talimatlar
export const getNetworkDebugInfo = () => {
  return `
🔧 NETWORK DEBUG BİLGİLERİ

Backend URL: http://192.168.1.104:3000/api

Kontrol Edilecekler:
✅ Backend çalışıyor mu? (Terminal'de "npm run dev")
✅ Telefon ve bilgisayar aynı WiFi'de mi?
✅ Backend 0.0.0.0:3000 üzerinden dinliyor mu?
✅ Firewall backend portunu engelliyor mu?

IP Değişirse:
Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
Sonra frontend/src/services/api.ts'de IP'yi güncelle
  `;
};

