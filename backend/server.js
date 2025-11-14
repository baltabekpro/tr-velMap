/**
 * ========================================
 * TRAVELMAP BACKEND - ГЛАВНЫЙ СЕРВЕР
 * ========================================
 * Объединённый API Gateway для всех микросервисов
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование всех запросов
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Импорт роутов микросервисов
const placesRouter = require('./routes/places.routes');
const weatherRouter = require('./routes/weather.routes');
const mapRouter = require('./routes/map.routes');
const chatRouter = require('./routes/chat.routes');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');

// Подключение роутов
app.use('/api/places', placesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/map', mapRouter);
app.use('/api/chat', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Статические файлы (для фронтенда)
app.use(express.static(path.join(__dirname, '../')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'trАvelMap Backend is running',
        timestamp: new Date().toISOString(),
        services: {
            places: 'online',
            weather: 'online',
            map: 'online',
            chat: 'online'
        }
    });
});

// Главная страница API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'trАvelMap API v1.0',
        endpoints: {
            places: '/api/places',
            weather: '/api/weather',
            map: '/api/map',
            chat: '/api/chat',
            auth: '/api/auth',
            health: '/api/health'
        }
    });
});

// 404 для API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('   🌍 trАvelMap Backend Server Started');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   📡 Server running on: http://localhost:${PORT}`);
    console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   📅 Started at: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('   Available endpoints:');
    console.log(`   • GET  /api/health - Health check`);
    console.log(`   • GET  /api/places - Get all places`);
    console.log(`   • GET  /api/weather - Get weather data`);
    console.log(`   • POST /api/chat - Chat with bot`);
    console.log(`   • GET  /api/map/markers - Get map markers`);
    console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
