const mongoose = require('mongoose');

const scheduleBlockSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: 15,
      default: 45,
    },
  },
  { _id: false },
);

const studyScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Weekly study schedule',
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    focusLevel: {
      type: String,
      enum: ['balanced', 'exam', 'revision'],
      default: 'balanced',
    },
    availableHours: {
      type: Number,
      min: 1,
      max: 80,
      default: 8,
    },
    days: [
      {
        type: String,
        trim: true,
      },
    ],
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    blocks: [scheduleBlockSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('StudySchedule', studyScheduleSchema);
