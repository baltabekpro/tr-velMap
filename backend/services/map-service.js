/**
 * ========================================
 * КАРТА МИКРОСЕРВИСІ / MAP MICROSERVICE
 * ========================================
 * ПОРТ: 3003
 * ЭНДПОИНТТЕР: /api/map/*
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mapRouter = require('../routes/map.routes');

const app = express();
const PORT = process.env.MAP_PORT || 3003;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Логирование
app.use((req, res, next) => {
    console.log(`[MAP] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Роуты
app.use('/', mapRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'map',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ [MAP SERVICE] Жұмыс істеп тұр: http://localhost:${PORT}`);
    console.log(`🗺️ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
