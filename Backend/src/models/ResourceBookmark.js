const mongoose = require('mongoose');

const resourceBookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, default: 'General' },
  subject: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  tags: { type: [String], default: [] },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.ResourceBookmark || mongoose.model('ResourceBookmark', resourceBookmarkSchema);
