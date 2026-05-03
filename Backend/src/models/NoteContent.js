const mongoose = require('mongoose');

const noteContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Optional reference to the main Note document if you want to link back to the actual PDF/file later
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    }
}, { timestamps: true });

// Create a text index on the content and title fields to enable fast keyword searching
noteContentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model("NoteContent", noteContentSchema);
