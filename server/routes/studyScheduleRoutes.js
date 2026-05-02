const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getMySchedules,
  generateSchedule,
} = require('../controllers/studyScheduleController');

const router = express.Router();

router.get('/', protect, getMySchedules);
router.post('/generate', protect, generateSchedule);

module.exports = router;
