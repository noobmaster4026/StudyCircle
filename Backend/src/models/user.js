const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    mobile: {
        type: String,
        required: true,
        match: /^[0-9]{11}$/,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
        reminderPreferences: {
        emailReminders:  { type: Boolean, default: true },
        inAppReminders:  { type: Boolean, default: true },
        reminderTimes:   { type: [Number], default: [60] }
    },
}, { timestamps: true });

// ✅ This checks if the model is already compiled before creating it
module.exports = mongoose.models.UserData || mongoose.model("UserData", userSchema);