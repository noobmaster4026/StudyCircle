const mongoose = require('mongoose');

const ratingEntrySchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    ratings: {
      type: [ratingEntrySchema],
      default: [],
    },
    average: {
      type: Number,
      default: null,
    },
    count: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);
