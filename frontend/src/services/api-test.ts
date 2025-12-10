// API Bağlantı Test Utility
// Telefonda backend'e bağlantıyı test etmek için

import axios from 'axios';
import { setManualServerIP, checkServerConnection } from './api';

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

// Belirli bir IP'ye bağlantı testi ve ayarlama
export const testAndSetServerIP = async (ip: string, port: number = 3000) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 Testing connection to: ${ip}:${port}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Önce server-info endpoint'ini test et
    const testUrl = `http://${ip}:${port}/api/server-info`;
    const response = await axios.get(testUrl, { 
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.data) {
      console.log('✅ Server connection successful!');
      console.log('📊 Server Response:', JSON.stringify(response.data, null, 2));
      
      // IP'yi manuel olarak ayarla
      await setManualServerIP(ip);
      
      // Bağlantıyı tekrar kontrol et
      const connectionCheck = await checkServerConnection(ip);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Server IP başarıyla ayarlandı ve test edildi!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return {
        success: true,
        ip,
        port,
        serverUrl: `http://${ip}:${port}/api`,
        serverInfo: response.data,
        connectionCheck,
      };
    }
    
    throw new Error('Invalid server response');
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ Connection test failed for ${ip}:${port}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Connection timeout - Backend might not be running or slow');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused - Check if backend is running on correct port');
    } else if (error.code === 'ENETUNREACH') {
      console.error('📡 Network unreachable - Check network connection');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - Check if server is accessible');
    }
    
    return {
      success: false,
      ip:'213.238.172.217',
      port:3000,
      error: error.message,
      errorCode: error.code,
    };
  }
};

// Bilgisayarın IP adresini bulmak için talimatlar
export const getNetworkDebugInfo = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const apiPort = process.env.EXPO_PUBLIC_API_PORT || '3000';
  
  return `
🔧 NETWORK DEBUG BİLGİLERİ

Backend URL: ${apiUrl}

Kontrol Edilecekler:
✅ Backend çalışıyor mu? (Terminal'de "npm run dev")
✅ Telefon ve bilgisayar aynı WiFi'de mi?
✅ Backend 0.0.0.0:${apiPort} üzerinden dinliyor mu?
✅ Backend 0.0.0.0:${apiPort} üzerinden dinliyor mu?
✅ Firewall backend portunu engelliyor mu?

IP Değişirse:
Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
Sonra .env dosyasında EXPO_PUBLIC_API_URL'yi güncelle
  `;
};

// Hızlı test: 213.238.172.217 IP'sine bağlantı testi
export const testProductionServer = async () => {
  return await testAndSetServerIP('213.238.172.217', 3000);
};

