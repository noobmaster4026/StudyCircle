const express = require('express');
const router = express.Router();

// ✅ FIX 1: removed auth middleware — this project uses no JWT middleware.
//            userId is passed via query param or request body instead.
// ✅ FIX 2: folder name is 'controller' (singular) not 'controllers' — matches your file tree.
const {
  getStudyGroups,
  getAvailableGroups,
  getStudyGroupById,
  runMatching,
  joinGroup,
  leaveGroup,
  getMyPreferences,
  updateMyPreferences,
} = require('../controller/studyGroupController');

// ── Preferences ──────────────────────────────────────────────────────────────
// GET  /api/study-groups/my-preferences?userId=xxx
router.get('/my-preferences', getMyPreferences);

// PATCH /api/study-groups/my-preferences   body: { userId, ...fields }
router.patch('/my-preferences', updateMyPreferences);

// ── Auto-matching ─────────────────────────────────────────────────────────────
// POST /api/study-groups/run-matching
router.post('/run-matching', runMatching);

// ── Group listings ────────────────────────────────────────────────────────────
// GET /api/study-groups?userId=xxx          → my groups
router.get('/', getStudyGroups);

// GET /api/study-groups/available?userId=xxx → groups I can join
router.get('/available', getAvailableGroups);

// ── Group actions ─────────────────────────────────────────────────────────────
// GET  /api/study-groups/:id
router.get('/:id', getStudyGroupById);

// POST /api/study-groups/join/:id   body: { userId, name, email }
router.post('/join/:id', joinGroup);

// POST /api/study-groups/leave/:id   body: { userId }
router.post('/leave/:id', leaveGroup);

module.exports = router;