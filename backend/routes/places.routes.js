/**
 * ========================================
 * РОУТЫ ДЛЯ МЕСТ / PLACES ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const placesController = require('../controllers/places.controller');

// GET /api/places - Получить все места
router.get('/', placesController.getAllPlaces);

// GET /api/places/:id - Получить место по ID
router.get('/:id', placesController.getPlaceById);

// GET /api/places/category/:category - Получить места по категории
router.get('/category/:category', placesController.getPlacesByCategory);

// GET /api/places/search - Поиск мест
router.get('/search', placesController.searchPlaces);

// POST /api/places - Создать новое место (для админа)
router.post('/', placesController.createPlace);

// PUT /api/places/:id - Обновить место
router.put('/:id', placesController.updatePlace);

// DELETE /api/places/:id - Удалить место
router.delete('/:id', placesController.deletePlace);

// POST /api/places/:id/favorite - Добавить в избранное
router.post('/:id/favorite', placesController.addToFavorites);

// POST /api/places/:id/review - Добавить отзыв
router.post('/:id/review', placesController.addReview);

module.exports = router;
