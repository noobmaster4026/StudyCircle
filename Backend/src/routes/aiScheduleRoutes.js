const express = require('express');
const { generateSchedule, listSchedules } = require('../controller/aiScheduleController');

const router = express.Router();

router.get('/', listSchedules);
router.post('/generate', generateSchedule);

module.exports = router;
