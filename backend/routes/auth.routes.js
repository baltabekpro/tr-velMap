/**
 * ========================================
 * РОУТЫ ДЛЯ АУТЕНТИФИКАЦИИ / AUTH ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register - Регистрация
router.post('/register', authController.register);

// POST /api/auth/login - Вход
router.post('/login', authController.login);

// POST /api/auth/logout - Выход
router.post('/logout', authController.logout);

// POST /api/auth/verify - Проверить токен
router.post('/verify', authController.verify);

// GET /api/auth/me - Получить текущего пользователя
router.get('/me', authController.getCurrentUser);

// GET /api/auth/profile - Получить текущего пользователя (алиас для /me)
router.get('/profile', authController.getCurrentUser);

// PUT /api/auth/profile - Обновить профиль
router.put('/profile', authController.updateProfile);

// Admin routes
router.get('/admin/stats', authController.getAdminStats);
router.get('/admin/users', authController.getAdminUsers);
router.get('/admin/logs', authController.getAdminLogs);
router.get('/admin/reviews', authController.getAdminReviews);
router.put('/admin/users/:id/status', authController.updateUserStatus);
router.put('/admin/users/:id/role', authController.updateUserRole);
router.delete('/admin/users/:id', authController.deleteUser);

module.exports = router;
