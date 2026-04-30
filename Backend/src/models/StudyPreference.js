const mongoose = require('mongoose');

/**
 * StudyPreference – stores each student's matching preferences.
 * Create or update via PATCH /api/study-groups/my-preferences
 */
const StudyPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: String,
  email: String,

  // What courses are they enrolled in?
  enrolledCourses: [String],  // ['CSE440', 'CSE446', 'CSE310']

  // When do they prefer to study?
  availableTimes: [{
    day: String,        // 'Monday'
    slots: [String],    // ['morning', 'afternoon', 'evening', 'night']
  }],

  // Study personality
  studyStyle: {
    type: String,
    enum: ['collaborative', 'individual-then-discuss', 'lecture-style', 'problem-solving'],
    default: 'collaborative',
  },

  // Academic goals
  goals: [{ type: String, enum: ['exam-prep', 'project-help', 'concept-review', 'homework', 'research'] }],

  // Communication preference
  communicationPref: { type: String, enum: ['text-heavy', 'voice', 'video', 'any'], default: 'any' },

  // Willing to be group leader?
  willingToLead: { type: Boolean, default: false },

  // Opt-in to automatic matching
  optIn: { type: Boolean, default: true },

  // Languages (for multilingual matching)
  languages: [String],

  // GPA band (optional, for peer-level matching)
  gpaBand: { type: String, enum: ['3.5-4.0', '3.0-3.5', '2.5-3.0', 'below-2.5', 'prefer-not-to-say'], default: 'prefer-not-to-say' },

  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StudyPreference', StudyPreferenceSchema);
