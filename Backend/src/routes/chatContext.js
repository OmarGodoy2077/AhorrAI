const express = require('express');
const ChatContextController = require('../controllers/chatContextController');

const router = express.Router();

// � Endpoint para obtener resumen financiero del usuario (para n8n chat)
// GET /api/chat-context/user-summary?userId=1
router.get('/user-summary', ChatContextController.getUserFinancialSummary);

module.exports = router;
