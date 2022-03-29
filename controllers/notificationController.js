const Notification = require('../models/notification');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification
        .find({ userId: req.body.user._id })
        .sort({ date: -1 })
    await Notification.updateMany({ userId: req.body.user._id }, { unseen: false });
    res.status(200).json({
        status: 'success',
        notifications
    })
})

exports.getNewNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification
        .find({ userId: req.body.user._id, unseen:true })
    res.status(200).json({
        status: 'success',
        isNew:notifications.length>0
    })
})

exports.addNotification = (req, res, next) => {
    createNote(req.body.user._id, req);
    res.status(201).json({
        status: 'success'
    })
}

exports.addNotificationToOthers = (req, res, next) => {
    const arr = req.params.userIds.split(',');
    arr.forEach(userId =>
        createNote(userId, req)
    )
    res.status(201).json({
        status: 'success'
    })
}

const createNote = (userId, req) => {
    Notification.create({
        userId: userId,
        date: req.body.note.date,
        message: req.body.note.message,
        code: req.body.note.code,
        storyId: req.body.note.storyId
    })
}