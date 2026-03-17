const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getMyBookings,
  createBooking,
  getTutorBookings,
} = require('../controllers/bookingController');

const router = express.Router();

// GET /api/bookings - list current student's bookings
router.get('/', protect, getMyBookings);

// GET /api/bookings/tutor - list current tutor's bookings
router.get('/tutor', protect, getTutorBookings);

// POST /api/bookings - create a new booking
router.post('/', protect, createBooking);

module.exports = router;
