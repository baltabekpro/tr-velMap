/**
 * ========================================
 * АУА РАЙЫ МИКРОСЕРВИСІ / WEATHER MICROSERVICE
 * ========================================
 * ПОРТ: 3002
 * ЭНДПОИНТТЕР: /api/weather/*
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const weatherRouter = require('../routes/weather.routes');

const app = express();
const PORT = process.env.WEATHER_PORT || 3002;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Логирование
app.use((req, res, next) => {
    console.log(`[WEATHER] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Роуты
app.use('/', weatherRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'weather',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        api: 'Open-Meteo'
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ [WEATHER SERVICE] Жұмыс істеп тұр: http://localhost:${PORT}`);
    console.log(`🌤️ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
