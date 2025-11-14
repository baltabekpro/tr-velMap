/**
 * ========================================
 * РОУТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ / USER ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const userPlacesController = require('../controllers/user-places.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/user/favorites - Получить избранные места
router.get('/favorites', userPlacesController.getFavorites);

// GET /api/user/visits - Получить историю посещений
router.get('/visits', userPlacesController.getVisits);

module.exports = router;
