const express = require('express');
const router = express.Router();
const { getUserRatings, submitUserRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/ratings/:userId
router.get('/:userId', getUserRatings);

// POST /api/ratings/:userId (requires auth)
router.post('/:userId', protect, submitUserRating);

module.exports = router;
