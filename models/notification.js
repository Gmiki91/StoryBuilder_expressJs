const mongoose = require('mongoose');
const notificationSchema = mongoose.Schema({
    userId: String,
    storyId: String,
    date: Number,
    message: String,
    unseen: { type: Boolean, default: true },
    code: 'A' | 'B' | 'C'
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', notificationSchema);