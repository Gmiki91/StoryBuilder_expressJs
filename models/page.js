const mongoose = require('mongoose');
const Correction = require('./correction');
const Rating = require('./rating');
const pageSchema = mongoose.Schema({
    text: String,
    language: String,
    authorId: String,
    authorName:String,
    ratings: [Rating],
    corrections:{type:[Correction], default:[]},
    archived:{type:Boolean, default:false}
}, { collection: 'pages' });

module.exports = mongoose.model('Page', pageSchema);