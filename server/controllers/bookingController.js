const Booking = require('../models/Booking');
const Tutor = require('../models/Tutor');
const User = require('../models/User');

// @desc    Get bookings for current user (student)
// @route   GET /api/bookings
// @access  Private
const getMyBookings = async (req, res) => {
  const studentId = req.user._id;

  const bookings = await Booking.find({ student: studentId })
    .populate({ path: 'tutor' })
    .sort({ date: 1 });

  // Ensure each booking returns the tutor name from the users collection when available.
  const tutorUserIds = new Set();
  const tutorEmails = new Set();

  bookings.forEach((booking) => {
    const tutor = booking.tutor || {};
    if (tutor.userId) tutorUserIds.add(String(tutor.userId));
    if (tutor.email) tutorEmails.add(tutor.email.toLowerCase());
  });

  const userQuery = {
    $or: [],
  };
  if (tutorUserIds.size > 0) {
    userQuery.$or.push({ _id: { $in: Array.from(tutorUserIds) } });
  }
  if (tutorEmails.size > 0) {
    userQuery.$or.push({ email: { $in: Array.from(tutorEmails) } });
  }

  let users = [];
  if (userQuery.$or.length > 0) {
    users = await User.find(userQuery).select('name email').lean();
  }

  const usersById = new Map(users.map((u) => [String(u._id), u]));
  const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

  const normalizedBookings = bookings.map((booking) => {
    const tutor = booking.tutor || {};
    const user = tutor.userId
      ? usersById.get(String(tutor.userId))
      : tutor.email
      ? usersByEmail.get(tutor.email.toLowerCase())
      : null;

    const tutorCopy = { ...(tutor.toObject ? tutor.toObject() : tutor) };
    if (user) {
      tutorCopy.name = user.name;
      tutorCopy.email = user.email;
    }

    return {
      ...booking.toObject(),
      tutor: tutorCopy,
    };
  });

  res.json(normalizedBookings);
};

// @desc    Create a new booking for current user (student)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const studentId = req.user._id;
  const { tutorId, date } = req.body;

  if (!tutorId || !date) {
    return res.status(400).json({ message: 'Tutor and date are required.' });
  }

  const bookingDate = new Date(date);
  if (Number.isNaN(bookingDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date.' });
  }

  // Ensure tutor exists
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) {
    return res.status(404).json({ message: 'Tutor not found.' });
  }

  // Prevent multiple bookings for the same tutor on the same day
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await Booking.findOne({
    tutor: tutorId,
    date: { $gte: dayStart, $lt: dayEnd },
  });

  if (existing) {
    return res
      .status(409)
      .json({ message: 'This tutor is already booked for the selected day.' });
  }

  const booking = await Booking.create({
    student: studentId,
    tutor: tutorId,
    date: bookingDate,
  });

  await booking.populate({ path: 'tutor', select: '-__v' });

  res.status(201).json(booking);
};

// @desc    Get bookings for current user (tutor/teacher)
// @route   GET /api/bookings/tutor
// @access  Private
const getTutorBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const tutor = await Tutor.findOne({ userId }).lean();
    if (!tutor) {
      return res.json([]);
    }

    const bookings = await Booking.find({ tutor: tutor._id })
      .populate({ path: 'student', select: 'name email' })
      .populate({ path: 'tutor' })
      .sort({ date: 1 });

    return res.json(bookings);
  } catch (err) {
    console.error('Get tutor bookings error:', err.message);
    return res.status(500).json({ message: 'Could not fetch tutor bookings.' });
  }
};

module.exports = {
  getMyBookings,
  createBooking,
  getTutorBookings,
};
