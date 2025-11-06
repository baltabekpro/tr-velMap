/**
 * ========================================
 * РОУТЫ ДЛЯ ПОГОДЫ / WEATHER ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

// GET /api/weather - Получить текущую погоду в Алматы
router.get('/', weatherController.getCurrentWeather);

// GET /api/weather/forecast - Получить прогноз погоды
router.get('/forecast', weatherController.getForecast);

// GET /api/weather/location/:lat/:lon - Получить погоду по координатам
router.get('/location/:lat/:lon', weatherController.getWeatherByLocation);

module.exports = router;
