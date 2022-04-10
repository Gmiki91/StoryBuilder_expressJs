const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Story = require('../models/story');

module.exports = catchAsync(async (req, res, next) => {
    const storyId = req.body.storyId || req.params.id
    const story = await Story.findById(storyId);
    if (story.authorId !== req.body.user._id.toString()) return next(new AppError('You can only edit your own story.', 401));
    req.body.story = story;
    next();
});