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

// GET /api/auth/me - Получить текущего пользователя
router.get('/me', authController.getCurrentUser);

module.exports = router;
