const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Study Room",
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    host: {
      type: String,
      default: "Host",
    },
    hostUserId: {
      type: String,
      default: null,
    },
    // When the session is scheduled to start (null = start immediately / ad-hoc)
    scheduledAt: {
      type: Date,
      default: null,
    },
    // Store participant userIds so cron can look up their emails
    participantUserIds: [{ type: String }],
    participants: [
      {
        userId: String,
        name: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);