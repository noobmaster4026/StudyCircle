 const express = require("express");
const router = express.Router();
const {
  createMeeting,
  joinMeeting,
  getMeetingById,
  endMeeting,
} = require("../controllers/meetingController");

router.post("/", createMeeting);
router.get("/:roomId", getMeetingById);
router.post("/:roomId/join", joinMeeting);
router.post("/:roomId/end", endMeeting);

module.exports = router;
