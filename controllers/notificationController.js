const Notification = require('../models/notification');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ userId: req.body.user._id });
    res.status(200).json({
        status: 'success',
        notifications
    })
})

exports.addNotification = (req, res, next) => {
    Notification.create({
        userId: req.body.user._id,
        date: req.body.note.date,
        message: req.body.note.message,
        code: req.body.note.code,
    });
    res.status(201).json({
        status: 'success'
    })
}

exports.addNotificationToOthers =  (req, res, next) => {
    req.params.userIds.forEach(userId => {
        Notification.create({
            userId: userId,
            date: req.body.note.date,
            message: req.body.note.message,
            code: req.body.note.code,
        });
    })

    res.status(201).json({
        status: 'success'
    })
}