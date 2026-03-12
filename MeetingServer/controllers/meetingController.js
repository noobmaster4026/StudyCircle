const Meeting = require("../models/Meeting");

// POST /api/meetings — create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { roomId, password, title, host } = req.body;

    if (!roomId || !password) {
      return res.status(400).json({ message: "roomId and password are required" });
    }

    // Check if room already exists
    const existing = await Meeting.findOne({ roomId });
    if (existing) {
      return res.status(409).json({ message: "Room ID already exists. Try a different one." });
    }

    const meeting = await Meeting.create({
      title: title || "Study Room",
      roomId,
      password,
      host: host || "Host",
      participants: [],
    });

    res.status(201).json({
      success: true,
      roomId: meeting.roomId,
      title: meeting.title,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/meetings/:roomId/join — verify password and join
exports.joinMeeting = async (req, res) => {
  try {
    const { password, userId, name } = req.body;
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found. Check the Room ID." });
    }

    if (!meeting.isActive) {
      return res.status(403).json({ message: "This meeting has ended." });
    }

    if (meeting.password !== password) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Add participant if not already in
    const alreadyJoined = meeting.participants.find((p) => p.userId === userId);
    if (!alreadyJoined && userId) {
      meeting.participants.push({ userId, name: name || "Guest" });
      await meeting.save();
    }

    res.json({
      success: true,
      roomId: meeting.roomId,
      title: meeting.title,
      host: meeting.host,
      participantCount: meeting.participants.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/meetings/:roomId — get meeting info
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    res.json({
      roomId: meeting.roomId,
      title: meeting.title,
      host: meeting.host,
      isActive: meeting.isActive,
      participantCount: meeting.participants.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/meetings/:roomId/end — end a meeting
exports.endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    meeting.isActive = false;
    await meeting.save();

    res.json({ message: "Meeting ended successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 
