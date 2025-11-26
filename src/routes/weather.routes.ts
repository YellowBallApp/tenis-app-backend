import { Router } from 'express';
import { getWeatherForecast, getWeatherForDateTime } from '../controllers/weather.controller';

const router = Router();

/**
 * GET /api/weather/forecast
 * Cache'den 7 günlük hava durumu tahminini getirir
 */
router.get('/forecast', getWeatherForecast);

/**
 * GET /api/weather/for-datetime?date=YYYY-MM-DD&time=HH:mm
 * Belirli bir tarih ve saat için hava durumu bilgisini getirir
 */
router.get('/for-datetime', getWeatherForDateTime);

export default router;

