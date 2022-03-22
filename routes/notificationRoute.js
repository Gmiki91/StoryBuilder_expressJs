const express = require('express');
const router = express.Router();
const authCheck = require('../middleware/authCheck');
const controller = require('../controllers/notificationController');
module.exports = router;

router.route('/')
.get(authCheck,controller.getNotifications)
.post(authCheck,controller.addNotification);

router.post('/:userIds', authCheck,controller.addNotificationToOthers)