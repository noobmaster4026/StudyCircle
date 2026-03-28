const express = require('express');
const { getNotifications, markAsRead } = require('../controller/notificationController');

const router = express.Router();

router.get('/:userId', getNotifications);
router.put('/read/:id', markAsRead);

module.exports = router;
