const mongoose = require('mongoose');

// Stores the user's study profile used to personalize recommendations
const userProfileSchema = new mongoose.Schema({

  // Subjects the user is currently studying e.g. ["Math", "React"]
  subjects: [{ type: String }],

  // Study goals e.g. ["improve problem solving", "learn hooks"]
  goals: [{ type: String }],

  // Upcoming deadlines — used to prioritize urgent recommendations
  deadlines: [{
    subject: { type: String },  // Which subject has the deadline
    topic:   { type: String },  // Specific topic e.g. "Calculus exam"
    date:    { type: Date }     // When the deadline is
  }],

  // History of how the user rated recommendations
  // Used to learn preferences and improve future suggestions
  feedbackHistory: [{
    recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation' },
    feedback:         { type: String, enum: ['up', 'down'] }, // thumbs up or down
    givenAt:          { type: Date, default: Date.now }
  }],

  // Tracks which subjects the user has studied most
  // Key = subject name, Value = number of study sessions
  studyHistory: {
    type: Map,
    of: Number,
    default: {}
  },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);