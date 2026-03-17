const express = require('express');
const router = express.Router();
const {
  getTutors,
  getMyTutor,
  updateMyTutor,
} = require('../controllers/tutorController');
const { protect } = require('../middleware/authMiddleware');

// Public tutor listing
router.get('/', getTutors);

// Private tutor profile (teacher only)
router.get('/me', protect, getMyTutor);
router.put('/me', protect, updateMyTutor);

module.exports = router;
