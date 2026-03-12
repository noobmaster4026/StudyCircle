// server/controllers/meetingController.js
// POST /api/meetings - create a new meeting
const Meeting = require('../models/Meeting');
const { v4: uuidv4 } = require('uuid');

// Create meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title } = req.body;

    const meeting = await Meeting.create({
      title,
      roomId: uuidv4(), // generate unique meeting link
      host: req.user._id,
      participants: [req.user._id],
    });

    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId })
      .populate('host', 'name email')
      .populate('participants', 'name email');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Join meeting
exports.addParticipant = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (!meeting.participants.includes(req.user._id)) {
      meeting.participants.push(req.user._id);
      await meeting.save();
    }

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// End meeting
exports.endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can end meeting' });
    }

    meeting.isActive = false;
    await meeting.save();

    res.json({ message: 'Meeting ended successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
