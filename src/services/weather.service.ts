import axios from 'axios';
import { AppDataSource } from '../config/data-source';
import { WeatherCache } from '../entities/weather.entity';

// İzmir, Türkiye koordinatları (İzmir merkez)
const DEFAULT_LATITUDE = 38.4192;
const DEFAULT_LONGITUDE = 27.1287;
const DEFAULT_LOCATION = 'izmir';

interface WeatherForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  hourlyData: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
    precipitation: number;
    windSpeed: number;
  }>;
}

class WeatherService {
  private weatherRepository = AppDataSource.getRepository(WeatherCache);

  /**
   * 7 günlük hava durumu tahminini Open-Meteo API'sinden çeker
   */
  async fetch7DayForecast(latitude: number = DEFAULT_LATITUDE, longitude: number = DEFAULT_LONGITUDE): Promise<WeatherForecast[]> {
    try {
      console.log(`🌤️ Hava durumu tahmini çekiliyor: ${latitude}, ${longitude}`);

      // Open-Meteo API'den 7 günlük saatlik tahmin çek
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          hourly: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
          timezone: 'Europe/Istanbul',
          forecast_days: 7,
        },
        timeout: 10000,
      });

      const data = response.data;
      
      if (!data || !data.daily || !data.hourly) {
        throw new Error('API\'den geçersiz veri formatı alındı');
      }
      
      const dailyData = data.daily;
      const hourlyData = data.hourly;
      
      if (!dailyData.time || !Array.isArray(dailyData.time) || dailyData.time.length < 7) {
        throw new Error(`API\'den yetersiz günlük veri alındı: ${dailyData.time?.length || 0} gün`);
      }
      
      if (!hourlyData.time || !Array.isArray(hourlyData.time) || hourlyData.time.length === 0) {
        throw new Error('API\'den saatlik veri alınamadı');
      }

      // 7 günlük veriyi işle
      const forecast: WeatherForecast[] = [];

      for (let i = 0; i < Math.min(7, dailyData.time.length); i++) {
        const date = dailyData.time[i];
        if (!date) continue;
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          console.warn(`⚠️ Geçersiz tarih atlandı: ${date}`);
          continue;
        }
        
        const dateString = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

        // O günün saatlik verilerini filtrele
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const hourlyForecast: WeatherForecast['hourlyData'] = [];

        for (let j = 0; j < hourlyData.time.length; j++) {
          if (!hourlyData.time[j]) continue;
          
          const hourTime = new Date(hourlyData.time[j]);
          if (isNaN(hourTime.getTime())) continue;
          
          if (hourTime >= dayStart && hourTime <= dayEnd) {
            hourlyForecast.push({
              time: `${hourTime.getHours().toString().padStart(2, '0')}:${hourTime.getMinutes().toString().padStart(2, '0')}`,
              temperature: Math.round(hourlyData.temperature_2m?.[j] || 0),
              weatherCode: hourlyData.weather_code?.[j] || 0,
              precipitation: hourlyData.precipitation?.[j] || 0,
              windSpeed: Math.round(hourlyData.wind_speed_10m?.[j] || 0),
            });
          }
        }

        forecast.push({
          date: dateString,
          weatherCode: dailyData.weather_code?.[i] || 0,
          temperatureMax: Math.round(dailyData.temperature_2m_max?.[i] || 0),
          temperatureMin: Math.round(dailyData.temperature_2m_min?.[i] || 0),
          precipitationSum: dailyData.precipitation_sum?.[i] || 0,
          hourlyData: hourlyForecast,
        });
      }
      
      if (forecast.length === 0) {
        throw new Error('İşlenebilir hava durumu verisi bulunamadı');
      }

      console.log(`✅ 7 günlük hava durumu tahmini başarıyla çekildi (${forecast.length} gün)`);
      return forecast;
    } catch (error: any) {
      console.error('❌ Hava durumu tahmini çekilirken hata:', error);
      console.error('❌ API hata detayları:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        params: error?.config?.params
      });
      throw error;
    }
  }

  /**
   * Hava durumu verilerini database'e cache olarak kaydeder
   */
  async cacheWeatherForecast(
    location: string = DEFAULT_LOCATION,
    latitude: number = DEFAULT_LATITUDE,
    longitude: number = DEFAULT_LONGITUDE,
    forecast: WeatherForecast[]
  ): Promise<WeatherCache> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setHours(24, 0, 0, 0); // Gece 12'de expire et

      // Eski cache'leri temizle (izmir_sarnic gibi eski location'ları sil)
      if (location === 'izmir') {
        const oldCache = await queryRunner.manager.findOne(WeatherCache, {
          where: { location: 'izmir_sarnic' },
        });
        if (oldCache) {
          await queryRunner.manager.remove(WeatherCache, oldCache);
          console.log(`🗑️ Eski cache temizlendi: izmir_sarnic`);
        }
      }

      // Transaction içinde mevcut cache'i kontrol et (race condition'ı önlemek için)
      let weatherCache = await queryRunner.manager.findOne(WeatherCache, {
        where: { location },
      });

      if (weatherCache) {
        // Mevcut cache'i güncelle
        weatherCache.latitude = latitude;
        weatherCache.longitude = longitude;
        weatherCache.dailyForecast = forecast as any;
        weatherCache.forecastStartDate = new Date(forecast[0].date);
        weatherCache.forecastEndDate = new Date(forecast[forecast.length - 1].date);
        weatherCache.lastUpdated = now;
        weatherCache.expiresAt = expiresAt;
        weatherCache = await queryRunner.manager.save(WeatherCache, weatherCache);
        console.log(`✅ Hava durumu cache güncellendi: ${location}`);
      } else {
        // Yeni cache oluştur
        weatherCache = queryRunner.manager.create(WeatherCache, {
          location,
          latitude,
          longitude,
          dailyForecast: forecast as any,
          forecastStartDate: new Date(forecast[0].date),
          forecastEndDate: new Date(forecast[forecast.length - 1].date),
          lastUpdated: now,
          expiresAt,
        });
        weatherCache = await queryRunner.manager.save(WeatherCache, weatherCache);
        console.log(`✅ Yeni hava durumu cache oluşturuldu: ${location}`);
      }

      await queryRunner.commitTransaction();
      return weatherCache;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      
      // Duplicate key hatası ise, tekrar deneme yap (başka bir process cache oluşturmuş olabilir)
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        console.log(`⚠️ Duplicate key hatası, cache zaten var. Tekrar kontrol ediliyor: ${location}`);
        // Tekrar kontrol et ve güncelle
        const existingCache = await this.weatherRepository.findOne({
          where: { location },
        });
        if (existingCache) {
          existingCache.latitude = latitude;
          existingCache.longitude = longitude;
          existingCache.dailyForecast = forecast as any;
          existingCache.forecastStartDate = new Date(forecast[0].date);
          existingCache.forecastEndDate = new Date(forecast[forecast.length - 1].date);
          existingCache.lastUpdated = new Date();
          existingCache.expiresAt = new Date();
          existingCache.expiresAt.setHours(24, 0, 0, 0);
          const updatedCache = await this.weatherRepository.save(existingCache);
          console.log(`✅ Cache duplicate key hatasından sonra güncellendi: ${location}`);
          return updatedCache;
        }
      }
      
      console.error('❌ Hava durumu cache kaydedilirken hata:', error);
      console.error('❌ Cache kaydetme hata detayları:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n')
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cache'den hava durumu verilerini getirir
   */
  async getCachedWeatherForecast(location: string = DEFAULT_LOCATION): Promise<WeatherForecast[] | null> {
    try {
      const weatherCache = await this.weatherRepository.findOne({
        where: { location },
      });

      if (!weatherCache) {
        console.log(`⚠️ Hava durumu cache bulunamadı: ${location}`);
        return null;
      }

      // Cache geçerli mi kontrol et
      const now = new Date();
      if (now > weatherCache.expiresAt) {
        console.log(`⚠️ Hava durumu cache süresi dolmuş: ${location}`);
        return null;
      }

      console.log(`✅ Cache'den hava durumu verisi alındı: ${location}`);
      return weatherCache.dailyForecast as any;
    } catch (error: any) {
      console.error('❌ Hava durumu cache okunurken hata:', error);
      return null;
    }
  }

  /**
   * Belirli bir tarih ve saat için hava durumu bilgisini getirir
   */
  async getWeatherForDateTime(
    date: string, // YYYY-MM-DD
    time: string, // HH:mm
    location: string = DEFAULT_LOCATION
  ): Promise<{ weatherCode: number; precipitation: number; isRainy: boolean; isSnowy: boolean } | null> {
    try {
      const forecast = await this.getCachedWeatherForecast(location);
      
      if (!forecast || forecast.length === 0) {
        console.log(`⚠️ Hava durumu cache boş veya bulunamadı: ${location}`);
        return null;
      }

      // Tarihe göre günü bul
      const dayForecast = forecast.find((f) => f.date === date);
      
      if (!dayForecast) {
        console.log(`⚠️ Tarih bulunamadı: ${date}. Mevcut tarihler: ${forecast.map(f => f.date).join(', ')}`);
        return null;
      }

      if (!dayForecast.hourlyData || dayForecast.hourlyData.length === 0) {
        console.log(`⚠️ Tarih için saatlik veri yok: ${date}`);
        return null;
      }

      // Saat formatını normalize et (HH:mm formatında olmalı)
      const normalizedTime = time.length === 5 ? time : `${time.padStart(2, '0')}:00`;
      
      // Saate göre saatlik veriyi bul
      let hourForecast = dayForecast.hourlyData.find((h) => {
        // Saati normalize et (sadece saat kısmını al)
        const hTime = h.time.length === 5 ? h.time : `${h.time.padStart(2, '0')}:00`;
        return hTime === normalizedTime;
      });
      
      if (!hourForecast && dayForecast.hourlyData.length > 0) {
        // Tam saat bulunamadıysa en yakın saati bul
        const [targetHour, targetMinute] = normalizedTime.split(':').map(Number);
        const targetMinutes = targetHour * 60 + (targetMinute || 0);
        
        let closestHour = dayForecast.hourlyData[0];
        let minDiff = Infinity;
        
        for (const hourData of dayForecast.hourlyData) {
          const [dataHour, dataMinute] = hourData.time.split(':').map(Number);
          const dataMinutes = dataHour * 60 + (dataMinute || 0);
          const diff = Math.abs(targetMinutes - dataMinutes);
          
          if (diff < minDiff) {
            minDiff = diff;
            closestHour = hourData;
          }
        }
        
        // Eğer en yakın saat 30 dakikadan fazla uzaktaysa, kabul etme
        if (minDiff > 30) {
          console.log(`⚠️ En yakın saat çok uzak: ${normalizedTime} için ${closestHour.time} (${minDiff} dakika fark)`);
          return null;
        }
        
        hourForecast = closestHour;
      }
      
      if (!hourForecast) {
        console.log(`⚠️ Saat için veri bulunamadı: ${normalizedTime}. Mevcut saatler: ${dayForecast.hourlyData.map(h => h.time).slice(0, 5).join(', ')}...`);
        return null;
      }

      // Weather code'a göre yağmur/kar kontrolü
      const isRainyByCode = this.isRainyWeather(hourForecast.weatherCode);
      const isSnowyByCode = this.isSnowyWeather(hourForecast.weatherCode);
      
      // Precipitation kontrolü - 0.05mm'den fazla yağış varsa yağmurlu kabul et (daha hassas)
      const hasPrecipitation = hourForecast.precipitation > 0.05;
      
      // Yağmur kontrolü: Weather code yağmurlu VEYA precipitation > 0.05mm (kar değilse)
      const isRainy = isRainyByCode || (hasPrecipitation && !isSnowyByCode);
      // Kar kontrolü: Weather code karlı VEYA precipitation > 0.1mm ve kar kodlu
      const isSnowy = isSnowyByCode;

      return {
        weatherCode: hourForecast.weatherCode,
        precipitation: hourForecast.precipitation,
        isRainy,
        isSnowy,
      };
    } catch (error: any) {
      console.error('❌ Belirli tarih/saat için hava durumu alınırken hata:', error);
      return null;
    }
  }

  /**
   * Weather code'un yağmurlu olup olmadığını kontrol eder
   */
  private isRainyWeather(weatherCode: number): boolean {
    // WMO Weather interpretation codes
    const rainyCodes = [
      61, 63, 65, // Hafif, orta, şiddetli yağmur
      66, 67, // Don yağmuru
      80, 81, 82, // Hafif, orta, şiddetli sağanak
      95, 96, 99, // Fırtına (yağmur ile)
    ];
    return rainyCodes.includes(weatherCode);
  }

  /**
   * Weather code'un karlı olup olmadığını kontrol eder
   */
  private isSnowyWeather(weatherCode: number): boolean {
    const snowyCodes = [
      71, 73, 75, // Hafif, orta, yoğun kar
      77, // Kar taneleri
      85, 86, // Kar sağanağı
    ];
    return snowyCodes.includes(weatherCode);
  }

  /**
   * Cron job için: 7 günlük hava durumunu çek ve cache'le
   */
  async updateWeatherForecast(): Promise<void> {
    try {
      console.log('🌤️ Hava durumu güncelleme başlatılıyor...');
      
      const forecast = await this.fetch7DayForecast();
      await this.cacheWeatherForecast(DEFAULT_LOCATION, DEFAULT_LATITUDE, DEFAULT_LONGITUDE, forecast);
      
      console.log('✅ Hava durumu başarıyla güncellendi');
    } catch (error: any) {
      console.error('❌ Hava durumu güncellenirken hata:', error);
      throw error;
    }
  }
}

export default new WeatherService();

