const mongoose = require('mongoose');
const notificationSchema = mongoose.Schema({
    userId: String,
    storyId: String,
    date: Number,
    message: String,
    unseen:Boolean,
    code: 'A' | 'B' | 'C'
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', notificationSchema);