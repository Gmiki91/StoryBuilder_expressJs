const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
module.exports = catchAsync(async (req, res, next) => {
    const { user, storyId } = req.body;
    //not new Story
    if (storyId) {
        if (!user.dailyCompleted && storyId === user.markedStoryId && user.markedStoryAt + 24 * 60 * 60 * 1000 > Date.now()) {
            user.dailyCompleted = true;
            user.coins += 1;
            req.body.tributeCompleted = true;
            user.save();
        } else if (user.confirmed && user.coins < 3) {
            return next(new AppError('You need 3 coins to create a new page.', 400));
        } else {
            //buying page
            user.coins -= 3;
            req.body.tributeCompleted = false;
            user.save();
        }
        //should be unreachable
    } else if (user.frogcoins < 3 && user.confirmed) {
        return next(new AppError('You need 3 accepted page to create a new story.', 400));
    }

    next();
});