// server/routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  createMeeting,
  getMeetingById,
  addParticipant,
  endMeeting,
} = require('../controllers/meetingController');

router.post('/', auth, createMeeting);
router.get('/:roomId', auth, getMeetingById);
router.post('/:roomId/join', auth, addParticipant);
router.post('/:roomId/end', auth, endMeeting);

module.exports = router;
