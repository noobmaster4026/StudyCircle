const express = require('express');
const router  = express.Router();
const {
  generateQuiz,
  saveResult,
  getHistory,
  getQuizById,
} = require('../controller/quizController');

// POST /api/quiz/generate        — AI quiz generation
router.post('/generate', generateQuiz);

// POST /api/quiz/save-result     — save a completed attempt
router.post('/save-result', saveResult);

// GET  /api/quiz/history         — ?userId=xxx
router.get('/history', getHistory);

// GET  /api/quiz/:id             — fetch a specific quiz by id
router.get('/:id', getQuizById);

module.exports = router;
