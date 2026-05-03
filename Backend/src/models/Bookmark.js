const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        trim: true
    },
    resourceType: {
        type: String,
        enum: ['link', 'video', 'document'],
        default: 'link'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
