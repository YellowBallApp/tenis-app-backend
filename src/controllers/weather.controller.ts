import { Request, Response } from 'express';
import weatherService from '../services/weather.service';

/**
 * Cache'den hava durumu verilerini getirir
 */
export const getWeatherForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const location = (req.query.location as string) || 'izmir';
    let forecast = await weatherService.getCachedWeatherForecast(location);
    
    // Eğer cache yoksa veya süresi dolmuşsa, otomatik olarak yeni veri çek
    if (!forecast || forecast.length === 0) {
      console.log(`⚠️ Cache yok veya boş, yeni hava durumu verisi çekiliyor: ${location}`);
      try {
        const newForecast = await weatherService.fetch7DayForecast(38.4192, 27.1287);
        await weatherService.cacheWeatherForecast(location, 38.4192, 27.1287, newForecast);
        forecast = newForecast;
        console.log(`✅ Cache başarıyla güncellendi: ${location}, ${newForecast.length} gün veri`);
      } catch (error: any) {
        console.error('❌ Otomatik hava durumu güncelleme hatası:', error);
        console.error('❌ Hata detayları:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          stack: error?.stack?.split('\n').slice(0, 5).join('\n')
        });
        res.status(500).json({
          success: false,
          message: `Hava durumu verisi çekilemedi: ${error?.message || error?.response?.data?.reason || 'Bilinmeyen hata'}. Lütfen daha sonra tekrar deneyin.`,
        });
        return;
      }
    }
    
    res.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error('Hava durumu getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hava durumu verisi alınırken bir hata oluştu.',
    });
  }
};

/**
 * Belirli bir tarih ve saat için hava durumu bilgisini getirir
 */
export const getWeatherForDateTime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, time, location } = req.query;
    
    if (!date || !time) {
      res.status(400).json({
        success: false,
        message: 'Tarih ve saat parametreleri gereklidir.',
      });
      return;
    }
    
    const locationKey = (location as string) || 'izmir';
    
    // Önce cache'den kontrol et
    let weather = await weatherService.getWeatherForDateTime(
      date as string,
      time as string,
      locationKey
    );
    
    // Eğer cache'de veri yoksa veya istenen tarih yoksa, yeni veri çek
    if (!weather) {
      console.log(`⚠️ Cache'de veri yok, yeni hava durumu verisi çekiliyor: ${locationKey}`);
      try {
        // Önce cache'i kontrol et, yoksa veya eskiyse güncelle
        let forecast = await weatherService.getCachedWeatherForecast(locationKey);
        
        if (!forecast || forecast.length === 0) {
          console.log(`⚠️ Cache boş, API'den yeni veri çekiliyor: ${locationKey}`);
          forecast = await weatherService.fetch7DayForecast(38.4192, 27.1287);
          await weatherService.cacheWeatherForecast(locationKey, 38.4192, 27.1287, forecast);
          console.log(`✅ Cache güncellendi: ${locationKey}, ${forecast.length} gün veri`);
        }
        
        // Tekrar dene
        weather = await weatherService.getWeatherForDateTime(
          date as string,
          time as string,
          locationKey
        );
        
        if (!weather) {
          res.status(404).json({
            success: false,
            message: 'Belirtilen tarih ve saat için hava durumu verisi bulunamadı.',
          });
          return;
        }
      } catch (error: any) {
        console.error('❌ Otomatik hava durumu güncelleme hatası:', error);
        console.error('❌ Hata detayları:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          stack: error?.stack?.split('\n').slice(0, 5).join('\n')
        });
        res.status(500).json({
          success: false,
          message: `Hava durumu verisi çekilemedi: ${error?.message || error?.response?.data?.reason || 'Bilinmeyen hata'}. Lütfen daha sonra tekrar deneyin.`,
        });
        return;
      }
    }
    
    res.json({
      success: true,
      data: weather,
    });
  } catch (error: any) {
    console.error('Tarih/saat için hava durumu getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hava durumu verisi alınırken bir hata oluştu.',
    });
  }
};

