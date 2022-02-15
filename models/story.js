const mongoose = require('mongoose');
const Rating = require('./subSchema');

const storySchema = mongoose.Schema({
    title: String,
    description: String,
    language: String,
    level: String,
    authorId: String,
    authorName: String,
    ratings: [Rating],
    upVotes:Number,
    ratingAvg:Number,
    updatedAt: Date,
    openEnded: Boolean,
    pageIds: [String],
    pendingPageIds: [String],
    word1:String,
    word2:String,
    word3:String,
}, { collection: 'stories' });

module.exports = mongoose.model('Story', storySchema);