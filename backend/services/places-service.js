/**
 * ========================================
 * ОРЫНДАР МИКРОСЕРВИСІ / PLACES MICROSERVICE
 * ========================================
 * ПОРТ: 3001
 * ЭНДПОИНТТЕР: /api/places/*
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const placesRouter = require('../routes/places.routes');

const app = express();
const PORT = process.env.PLACES_PORT || 3001;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Логирование
app.use((req, res, next) => {
    console.log(`[PLACES] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Роуты
app.use('/', placesRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'places',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ [PLACES SERVICE] Жұмыс істеп тұр: http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
