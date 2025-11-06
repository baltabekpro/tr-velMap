/**
 * ========================================
 * РОУТЫ ДЛЯ ЧАТБОТА / CHAT ROUTES
 * ========================================
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat - Отправить сообщение боту
router.post('/', chatController.sendMessage);

// GET /api/chat/suggestions - Получить подсказки
router.get('/suggestions', chatController.getSuggestions);

module.exports = router;
