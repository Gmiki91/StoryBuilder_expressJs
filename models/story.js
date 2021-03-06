const mongoose = require('mongoose');
const Rating = require('./rating');

const storySchema = mongoose.Schema({
    title: String,
    description: String,
    language: String,
    levels:  [{ userId: String, rate: Number }],
    authorId: String,
    authorName: String,
    ratings: [Rating],
    upVotes:Number,
    ratingAvg:Number,
    updatedAt: Number,
    open: {type:Boolean, default: true},
    pageIds: [String],
    pendingPageIds: [String],
    word1:String,
    word2:String,
    word3:String,
}, { collection: 'stories' });

module.exports = mongoose.model('Story', storySchema);