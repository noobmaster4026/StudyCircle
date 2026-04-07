const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename:      { type: String, required: true },
  originalName:  { type: String, required: true },
  extractedText: { type: String, required: true },
  pageCount:     { type: Number, default: 1 },
  fileSize:      { type: Number },
  fileType:      { type: String },
  fileUrl:       { type: String },
  shareToken:    { type: String, unique: true },
  isShared:      { type: Boolean, default: false },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);