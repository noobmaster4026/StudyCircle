const express = require('express');
const router = express.Router();
const { askQuestion } = require('../controllers/chatbotController');

// Route for asking the AI chatbot a question
router.post('/ask', askQuestion);

module.exports = router;
