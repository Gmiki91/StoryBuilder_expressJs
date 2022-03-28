const catchAsync = require('../utils/catchAsync');

module.exports = catchAsync(async (req, res, next) => {
    const { user } = req.body;
    if (!user.dailyCompleted && req.body.storyId === user.markedStoryId && user.markedStoryAt + 24 * 60 * 60 * 1000 > Date.now()) {
        user.dailyCompleted = true;
        user.coins += 1;
        req.body.tributeCompleted = true;
    } else { 
        //buying page
        user.coins -= 3;
        req.body.tributeCompleted = false;
    }
    user.save();
    next();
});