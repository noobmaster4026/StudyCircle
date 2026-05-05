const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateSchedule, listSchedules } = require('../controllers/aiScheduleController');

router.get('/', protect, listSchedules);
router.post('/generate', protect, generateSchedule);

module.exports = router;
