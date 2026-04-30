const mongoose = require('mongoose');

const StudyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: String, required: true },         // e.g. "CSE440"
  courseTitle: { type: String },                     // e.g. "Natural Language Processing"
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  maxSize: { type: Number, default: 5 },
  status: { type: String, enum: ['forming', 'active', 'completed', 'dissolved'], default: 'forming' },

  // Matching metadata
  matchScore: { type: Number, default: 0 },          // compatibility score when formed
  matchFactors: {
    sharedCourses: [String],
    sharedGoals: [String],
    preferredTimes: [String],                         // ['morning', 'evening', 'night']
    studyStyle: String,                               // 'collaborative', 'individual-then-discuss', 'lecture-style'
  },

  // Communication
  whiteboardRoomId: { type: String },                // pre-created whiteboard room ID
  meetingRoomId: { type: String },                   // for video sessions via MeetingServer

  // Scheduling
  weeklySchedule: [{
    day: String,    // 'Monday', etc.
    startTime: String,  // '18:00'
    endTime: String,
  }],

  autoCreated: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt
StudyGroupSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual: is the group full?
StudyGroupSchema.virtual('isFull').get(function () {
  return this.members.length >= this.maxSize;
});

StudyGroupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudyGroup', StudyGroupSchema);
