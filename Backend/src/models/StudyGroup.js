const mongoose = require('mongoose');

const StudyGroupSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    course:      { type: String, required: true },   // e.g. "CSE440"
    courseTitle: { type: String },                    // e.g. "Natural Language Processing"

    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name:   { type: String },
        email:  { type: String },
        role:   { type: String, enum: ['leader', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    maxSize: { type: Number, default: 10 },

    status: {
      type: String,
      enum: ['forming', 'active', 'completed', 'dissolved'],
      default: 'forming',
    },

    // Matching metadata
    matchFactors: {
      sharedCourses:  [String],
      sharedGoals:    [String],
      preferredTimes: [String],
      studyStyle:     String,
    },

    // Room IDs for whiteboard and video sessions
    whiteboardRoomId: { type: String },
    meetingRoomId:    { type: String },

    // Weekly schedule (optional)
    weeklySchedule: [
      {
        day:       String,
        startTime: String,
        endTime:   String,
      },
    ],

    autoCreated: { type: Boolean, default: true },
  },
  {
    // timestamps: true automatically manages createdAt and updatedAt.
    // No pre-save hook needed — that was causing "next is not a function"
    // on Mongoose v7+ because next is no longer passed as a parameter.
    timestamps: true,
  }
);

// Virtual: is the group at capacity?
StudyGroupSchema.virtual('isFull').get(function () {
  return this.members.length >= this.maxSize;
});

StudyGroupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudyGroup', StudyGroupSchema);