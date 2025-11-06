/**
 * ========================================
 * ЧАТБОТ МИКРОСЕРВИСІ / CHAT MICROSERVICE
 * ========================================
 * ПОРТ: 3004
 * ЭНДПОИНТТЕР: /api/chat/*
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const chatRouter = require('../routes/chat.routes');

const app = express();
const PORT = process.env.CHAT_PORT || 3004;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Логирование
app.use((req, res, next) => {
    console.log(`[CHAT] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Роуты
app.use('/', chatRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'chat',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ [CHAT SERVICE] Жұмысістеп тұр: http://localhost:${PORT}`);
    console.log(`💬 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
