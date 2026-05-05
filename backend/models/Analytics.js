const mongoose = require('mongoose');

// Stores daily study session logs used to compute all dashboard metrics
const analyticsSchema = new mongoose.Schema({

  date: { type: Date, required: true }, // The date of the study session

  subject: { type: String, required: true }, // Subject studied e.g. "React"

  // Duration of the study session in minutes
  minutesStudied: { type: Number, required: true, min: 0 },

  // Source of the session — pomodoro timer, manual log, or flashcard review
  sessionType: {
    type: String,
    enum: ['pomodoro', 'manual', 'flashcard'],
    default: 'manual'
  },

  // Flashcard performance for this session
  flashcardStats: {
    total:   { type: Number, default: 0 }, // Total cards reviewed
    correct: { type: Number, default: 0 }, // Cards answered correctly
  },

  // Quiz performance for this session
  quizStats: {
    total:   { type: Number, default: 0 }, // Total quiz questions attempted
    correct: { type: Number, default: 0 }, // Questions answered correctly
  },

  // Whether the user completed their study goal for the day
  goalCompleted: { type: Boolean, default: false },

  // Number of pomodoro sessions completed in this log entry
  pomodoroCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analytics', analyticsSchema);