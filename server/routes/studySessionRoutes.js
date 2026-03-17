const express = require('express');
const router = express.Router();
const {
  getStudySessions,
  createStudySession,
  deleteStudySession,
  joinStudySession,
} = require('../controllers/studySessionController');

// GET /api/study-sessions
router.get('/', getStudySessions);

// POST /api/study-sessions
router.post('/', createStudySession);

// DELETE /api/study-sessions/:id
router.delete('/:id', deleteStudySession);

// POST /api/study-sessions/:id/join
router.post('/:id/join', joinStudySession);

module.exports = router;
