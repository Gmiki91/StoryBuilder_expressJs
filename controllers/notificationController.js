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
        notes:notifications.length
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
    const index = arr.indexOf(req.body.user._id.toString())
    if(index !== -1) {
        arr.splice(index, 1);
    }
    arr.forEach(userId =>
        createNote(userId, req)
    )
    res.status(201).json({
        status: 'success'
    })
}

const createNote = (userId, req) => {
    const {date, message, code, storyId, unseen} = req.body.note;
    Notification.create({
        userId,
        date,
        message,
        code,
        storyId,
        unseen
    })
}