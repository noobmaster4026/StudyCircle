const express = require('express');
const router = express.Router();
const {
    logStudyActivity,
    getStreakData
} = require('../controllers/streakController');

// Routes for streak tracking
router.post('/log', logStudyActivity);
router.get('/:userId', getStreakData);

module.exports = router;
