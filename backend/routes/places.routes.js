/**
 * ========================================
 * РОУТЫ ДЛЯ МЕСТ / PLACES ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const placesController = require('../controllers/places.controller');
const userPlacesController = require('../controllers/user-places.controller');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');

// GET /api/places - Получить все места (опциональная авторизация)
router.get('/', optionalAuth, placesController.getAllPlaces);

// GET /api/places/:id - Получить место по ID (опциональная авторизация)
router.get('/:id', optionalAuth, placesController.getPlaceById);

// GET /api/places/category/:category - Получить места по категории
router.get('/category/:category', optionalAuth, placesController.getPlacesByCategory);

// GET /api/places/search - Поиск мест
router.get('/search', optionalAuth, placesController.searchPlaces);

// POST /api/places - Создать новое место (только для админа)
router.post('/', authenticate, requireAdmin, placesController.createPlace);

// PUT /api/places/:id - Обновить место (только для админа)
router.put('/:id', authenticate, requireAdmin, placesController.updatePlace);

// DELETE /api/places/:id - Удалить место (только для админа)
router.delete('/:id', authenticate, requireAdmin, placesController.deletePlace);

// POST /api/places/:id/favorite - Добавить в избранное
router.post('/:id/favorite', authenticate, userPlacesController.addToFavorites);

// DELETE /api/places/:id/favorite - Удалить из избранного
router.delete('/:id/favorite', authenticate, userPlacesController.removeFromFavorites);

// POST /api/places/:id/rating - Поставить рейтинг
router.post('/:id/rating', authenticate, userPlacesController.ratePlace);

// POST /api/places/:id/review - Добавить отзыв
router.post('/:id/review', authenticate, userPlacesController.addReview);

// POST /api/places/:id/like - Лайк отзыва
router.post('/:id/like', authenticate, userPlacesController.likeReview);

// DELETE /api/places/:id/like - Убрать лайк с отзыва
router.delete('/:id/like', authenticate, userPlacesController.unlikeReview);

// POST /api/places/:id/visit - Добавить посещение
router.post('/:id/visit', authenticate, userPlacesController.addVisit);

module.exports = router;
