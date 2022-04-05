const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
module.exports = catchAsync(async (req, res, next) => {
    const { user } = req.body;
    if (!user.dailyCompleted && req.body.storyId === user.markedStoryId && user.markedStoryAt + 24 * 60 * 60 * 1000 > Date.now()) {
        user.dailyCompleted = true;
        user.coins += 1;
        req.body.tributeCompleted = true;
    } else if (user.confirmed && req.body.user.coins < 3) {
        return next(new AppError('You need 3 coins to create a new page.', 400));
    } else {
        //buying page
        user.coins -= 3;
        req.body.tributeCompleted = false;
    }
    user.save();
    next();
});