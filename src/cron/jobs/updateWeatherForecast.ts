import weatherService from '../../services/weather.service';

/**
 * 7 günlük hava durumu tahminini günceller
 * Her gün gece 23:55'te çalışır
 * 
 * İşlevler:
 * 1. Open-Meteo API'den 7 günlük hava durumu tahminini çeker
 * 2. Veritabanına cache olarak kaydeder
 * 3. Cache gece 12'de expire olur (ertesi gün tekrar güncellenecek)
 */
export const updateWeatherForecast = async () => {
  try {
    console.log('🌤️ Hava durumu güncelleme job\'u başlatılıyor...');
    
    await weatherService.updateWeatherForecast();
    
    console.log('✅ Hava durumu güncelleme job\'u başarıyla tamamlandı');
  } catch (error: any) {
    console.error('❌ Hava durumu güncelleme job\'u hatası:', error);
    // Job hatası uygulamayı crash etmesin
  }
};

