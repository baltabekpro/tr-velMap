/**
 * ========================================
 * API GATEWAY - ШЛЮЗ ДЛЯ ВСЕХ МИКРОСЕРВИСОВ
 * ========================================
 * ПОРТ: 3000
 * ФУНКЦИЯ: Проксирование запросов к микросервисам
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация микросервисов
const SERVICES = {
    places: process.env.PLACES_URL || 'http://localhost:3001',
    weather: process.env.WEATHER_URL || 'http://localhost:3002',
    map: process.env.MAP_URL || 'http://localhost:3003',
    chat: process.env.CHAT_URL || 'http://localhost:3004'
};

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Статические файлы
app.use(express.static(path.join(__dirname, '../')));

// ========================================
// ПРОКСИРОВАНИЕ К МИКРОСЕРВИСАМ
// ========================================

// Общая функция проксирования
async function proxyRequest(serviceUrl, req, res) {
    try {
        const url = `${serviceUrl}${req.path}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        res.json(response.data);
    } catch (error) {
        console.error(`❌ [GATEWAY] Ошибка проксирования:`, error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: 'Сервис временно недоступен',
            service: serviceUrl,
            message: error.message
        });
    }
}

// Places Service - все запросы начинающиеся с /api/places
app.use('/api/places', (req, res) => {
    const originalPath = req.path;
    console.log(`[GATEWAY] Proxying /api/places${originalPath} -> ${SERVICES.places}${originalPath}`);
    proxyRequest(SERVICES.places, req, res);
});

// Weather Service
app.use('/api/weather', (req, res) => {
    const originalPath = req.path;
    console.log(`[GATEWAY] Proxying /api/weather${originalPath} -> ${SERVICES.weather}${originalPath}`);
    proxyRequest(SERVICES.weather, req, res);
});

// Map Service
app.use('/api/map', (req, res) => {
    const originalPath = req.path;
    console.log(`[GATEWAY] Proxying /api/map${originalPath} -> ${SERVICES.map}${originalPath}`);
    proxyRequest(SERVICES.map, req, res);
});

// Chat Service
app.use('/api/chat', (req, res) => {
    const originalPath = req.path;
    console.log(`[GATEWAY] Proxying /api/chat${originalPath} -> ${SERVICES.chat}${originalPath}`);
    proxyRequest(SERVICES.chat, req, res);
});

// ========================================
// МОНИТОРИНГ СЕРВИСОВ
// ========================================

app.get('/api/health', async (req, res) => {
    const services = {};
    
    // Проверка каждого микросервиса
    for (const [name, url] of Object.entries(SERVICES)) {
        try {
            const response = await axios.get(`${url}/health`, { timeout: 2000 });
            services[name] = {
                ...response.data,
                status: response.data.status || 'online'
            };
        } catch (error) {
            services[name] = {
                status: 'offline',
                error: error.message,
                url: url
            };
        }
    }
    
    const allHealthy = Object.values(services).every(s => s.status === 'online' || s.status === 'healthy');
    
    res.json({
        gateway: {
            status: 'online',
            port: PORT,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        },
        services: services,
        overall: allHealthy ? 'healthy' : 'degraded'
    });
});

// ========================================
// ЗАПУСК СЕРВЕРА
// ========================================

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 API GATEWAY ЖҰМЫС ІСТЕП ТҰР');
    console.log('========================================');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('\n🔗 Микросервистер:');
    console.log(`   📍 Places:  ${SERVICES.places}`);
    console.log(`   🌤️  Weather: ${SERVICES.weather}`);
    console.log(`   🗺️  Map:     ${SERVICES.map}`);
    console.log(`   💬 Chat:    ${SERVICES.chat}`);
    console.log('========================================\n');
});

module.exports = app;
