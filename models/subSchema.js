const mongoose = require('mongoose');
module.exports = Rating = mongoose.Schema({
    userId: String, rate: Number
}, { _id: false });