const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
      type: String,
      enum: ["reminder", "system", "message"],
      default: "reminder",
    },
    // ID of the Goal or Meeting that triggered this
    relatedId: {
      type: String,
      default: null,
    },
    // Extra metadata (e.g., which trigger window: 15, 60, etc.)
    meta: {
      type: Number,
      default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
