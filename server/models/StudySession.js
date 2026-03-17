const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
  },
  { _id: false }
);

const studySessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    inviteCode: {
      type: String,
      trim: true,
      minlength: 9,
      maxlength: 9,
      default: null,
      index: true,
      unique: true,
      sparse: true,
    },
    creator: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    seatLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudySession', studySessionSchema);
