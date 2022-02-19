const mongoose = require('mongoose');
const Rating = require('./subSchema');
const pageSchema = mongoose.Schema({
    text: String,
    language: String,
    authorId: String,
    authorName:String,
    ratings: [Rating],
    archived:{type:Boolean, default:false}
}, { collection: 'pages' });

module.exports = mongoose.model('Page', pageSchema);