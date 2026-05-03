const mongoose = require('mongoose');

const studyStreakSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  studyDates: { type: [String], default: [] },
  longestStreak: { type: Number, default: 0 },
  lastCheckIn: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.StudyStreak || mongoose.model('StudyStreak', studyStreakSchema);
