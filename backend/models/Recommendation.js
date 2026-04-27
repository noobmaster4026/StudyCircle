const mongoose = require('mongoose');

// Stores each recommendation item shown to the user
const recommendationSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ['topic', 'resource', 'session', 'tutor'], // Category of recommendation
    required: true
  },

  title:       { type: String, required: true },  // Main title shown on the card
  description: { type: String },                  // Short description of the recommendation
  subject:     { type: String },                  // Subject this recommendation belongs to e.g. "Math"
  tags:        [{ type: String }],                // Array of topic tags e.g. ["algebra", "equations"]
  url:         { type: String },                  // Optional external link for resources
  difficulty:  {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },

  // Feedback tracking — counts thumbs up and thumbs down from users
  thumbsUp:   { type: Number, default: 0 },
  thumbsDown: { type: Number, default: 0 },

  // Relevance score used to rank recommendations (higher = shown first)
  score: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);