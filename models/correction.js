const mongoose = require('mongoose');
const Correction = mongoose.Schema({
    by: String, 
    error: String, 
    correction: String,
}, { _id: false });
module.exports = Correction;