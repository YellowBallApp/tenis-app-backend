import axios from 'axios';

export interface WeatherData {
  temperature: number;
  temperatureUnit: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  location: string;
  timestamp: Date;
}

// Open-Meteo API kullanarak hava durumu bilgisi çekme
// Ücretsiz, API key gerektirmiyor

// İzmir Sarnıç için varsayılan koordinatlar
const DEFAULT_LATITUDE = 38.3194; // İzmir Sarnıç
const DEFAULT_LONGITUDE = 27.1497; // İzmir Sarnıç

export const weatherService = {
  // Şehir adına göre koordinat bulma (basit bir lookup)
  getCityCoordinates: (cityName: string): { lat: number; lon: number } | null => {
    const cities: { [key: string]: { lat: number; lon: number } } = {
      istanbul: { lat: 41.0082, lon: 28.9784 },
      ankara: { lat: 39.9334, lon: 32.8597 },
      izmir: { lat: 38.4192, lon: 27.1287 },
      antalya: { lat: 36.8969, lon: 30.7133 },
      bursa: { lat: 40.1826, lon: 29.0665 },
      adana: { lat: 36.9914, lon: 35.3308 },
      gaziantep: { lat: 37.0662, lon: 37.3833 },
      konya: { lat: 37.8746, lon: 32.4932 },
      kayseri: { lat: 38.7312, lon: 35.4787 },
      eskişehir: { lat: 39.7767, lon: 30.5206 },
    };

    const normalizedCity = cityName.toLowerCase().trim();
    return cities[normalizedCity] || null;
  },

  // Hava durumu bilgisi çekme
  getCurrentWeather: async (
    cityName?: string,
    latitude?: number,
    longitude?: number
  ): Promise<WeatherData> => {
    try {
      let lat = latitude;
      let lon = longitude;
      let location = 'İzmir Sarnıç';

      // Koordinatlar verilmemişse, şehir adına göre bul veya varsayılan kullan
      if (!lat || !lon) {
        if (cityName) {
          const coords = weatherService.getCityCoordinates(cityName);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
            location = cityName.charAt(0).toUpperCase() + cityName.slice(1);
          } else {
            // Şehir bulunamadıysa varsayılan koordinatları kullan
            lat = DEFAULT_LATITUDE;
            lon = DEFAULT_LONGITUDE;
          }
        } else {
          lat = DEFAULT_LATITUDE;
          lon = DEFAULT_LONGITUDE;
        }
      }

      // Open-Meteo API'den hava durumu bilgisi çek
      const weatherApiUrl = process.env.EXPO_PUBLIC_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';
      const response = await axios.get(weatherApiUrl, {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m',
          timezone: 'Europe/Istanbul',
          forecast_days: 1,
        },
        timeout: 5000,
      });

      const data = response.data;
      const current = data.current;

      // Weather code'a göre açıklama ve ikon belirleme
      const weatherInfo = weatherService.getWeatherDescription(current.weather_code);
      
      return {
        temperature: Math.round(current.temperature_2m),
        temperatureUnit: '°C',
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        location: location,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Hava durumu çekilirken hata:', error);
      // Hata durumunda varsayılan veri döndür
      return {
        temperature: 20,
        temperatureUnit: '°C',
        description: 'Bilinmiyor',
        icon: 'weather-cloudy',
        humidity: 0,
        windSpeed: 0,
        windDirection: 0,
        location: cityName || 'İzmir Sarnıç',
        timestamp: new Date(),
      };
    }
  },

  // Weather code'a göre açıklama ve ikon belirleme
  getWeatherDescription: (weatherCode: number): { description: string; icon: string } => {
    // WMO Weather interpretation codes (WW)
    const weatherCodes: { [key: number]: { description: string; icon: string } } = {
      0: { description: 'Açık', icon: 'weather-sunny' },
      1: { description: 'Çoğunlukla Açık', icon: 'weather-partly-cloudy' },
      2: { description: 'Kısmen Bulutlu', icon: 'weather-partly-cloudy' },
      3: { description: 'Kapalı', icon: 'weather-cloudy' },
      45: { description: 'Sisli', icon: 'weather-fog' },
      48: { description: 'Don Sisli', icon: 'weather-fog' },
      51: { description: 'Hafif Çiseleme', icon: 'weather-partly-rainy' },
      53: { description: 'Orta Çiseleme', icon: 'weather-rainy' },
      55: { description: 'Yoğun Çiseleme', icon: 'weather-pouring' },
      56: { description: 'Hafif Don Çiseleme', icon: 'weather-snowy-rainy' },
      57: { description: 'Yoğun Don Çiseleme', icon: 'weather-snowy-rainy' },
      61: { description: 'Hafif Yağmur', icon: 'weather-rainy' },
      63: { description: 'Orta Yağmur', icon: 'weather-rainy' },
      65: { description: 'Şiddetli Yağmur', icon: 'weather-pouring' },
      66: { description: 'Hafif Don Yağmuru', icon: 'weather-snowy-rainy' },
      67: { description: 'Yoğun Don Yağmuru', icon: 'weather-snowy-rainy' },
      71: { description: 'Hafif Kar', icon: 'weather-snowy' },
      73: { description: 'Orta Kar', icon: 'weather-snowy' },
      75: { description: 'Yoğun Kar', icon: 'weather-heavy-snow' },
      77: { description: 'Kar Taneleri', icon: 'weather-snowy' },
      80: { description: 'Hafif Sağanak', icon: 'weather-rainy' },
      81: { description: 'Orta Sağanak', icon: 'weather-pouring' },
      82: { description: 'Şiddetli Sağanak', icon: 'weather-pouring' },
      85: { description: 'Hafif Kar Sağanağı', icon: 'weather-snowy' },
      86: { description: 'Yoğun Kar Sağanağı', icon: 'weather-heavy-snow' },
      95: { description: 'Fırtına', icon: 'weather-lightning' },
      96: { description: 'Dolu ile Fırtına', icon: 'weather-lightning-rainy' },
      99: { description: 'Şiddetli Dolu ile Fırtına', icon: 'weather-lightning-rainy' },
    };

    return weatherCodes[weatherCode] || { description: 'Bilinmiyor', icon: 'weather-cloudy' };
  },
};

