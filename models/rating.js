const mongoose = require('mongoose');
const Rating = mongoose.Schema({
    userId: String, rate: Number
}, { _id: false });
module.exports = Rating;