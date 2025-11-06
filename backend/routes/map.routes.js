/**
 * ========================================
 * РОУТЫ ДЛЯ КАРТЫ / MAP ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

// GET /api/map/markers - Получить все маркеры для карты
router.get('/markers', mapController.getAllMarkers);

// GET /api/map/markers/:id - Получить маркер по ID
router.get('/markers/:id', mapController.getMarkerById);

// GET /api/map/bounds - Получить границы карты
router.get('/bounds', mapController.getMapBounds);

// POST /api/map/route - Построить маршрут между точками
router.post('/route', mapController.calculateRoute);

module.exports = router;
