const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // Emoji or URL
    earnedAt: { type: Date, default: Date.now }
}, { _id: false });

const streakSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true,
        unique: true // One streak record per user
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastStudyDate: {
        type: Date,
        default: null
    },
    badges: [badgeSchema]
}, { timestamps: true });

module.exports = mongoose.model("Streak", streakSchema);
