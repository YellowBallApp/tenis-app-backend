import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage'daki tüm auth token'larını temizler
 * Debug/test amaçlı kullanılabilir
 */
export const clearAuthTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    console.log('✅ Auth token\'lar temizlendi');
  } catch (error) {
    console.error('❌ Token temizleme hatası:', error);
  }
};

/**
 * AsyncStorage'daki tüm verileri temizler
 * Dikkat: Tüm uygulama verilerini siler!
 */
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ Tüm AsyncStorage temizlendi');
  } catch (error) {
    console.error('❌ Storage temizleme hatası:', error);
  }
};

/**
 * AsyncStorage'daki mevcut token'ları konsola yazdırır
 */
export const debugTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    console.log('🔍 Token Debug:');
    console.log('  Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'yok');
    console.log('  Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'yok');
  } catch (error) {
    console.error('❌ Token debug hatası:', error);
  }
};

