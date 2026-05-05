const mongoose = require('mongoose');

const subjectEntrySchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const deadlineEntrySchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const inputSchema = new mongoose.Schema(
  {
    subjects: {
      type: [subjectEntrySchema],
      default: [],
    },
    subjectSummary: { type: String, trim: true, default: '' },
    goals: { type: String, trim: true, default: '' },
    hoursPerWeek: { type: Number, min: 1, max: 80, required: true },
    durationWeeks: { type: Number, min: 1, max: 52, required: true },
    preferredStudyTimes: { type: [String], default: [] },
    deadlines: { type: [deadlineEntrySchema], default: [] },
    subject: { type: String, trim: true },
    examNotes: { type: String, trim: true },
  },
  { _id: false }
);

const aiStudyScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    owner: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
    },
    inputs: { type: inputSchema, required: true },
    schedule: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    model: { type: String, default: 'gemini' },
  },
  { timestamps: true, collection: 'ai_study_schedules' }
);

module.exports = mongoose.model('AiStudySchedule', aiStudyScheduleSchema);
