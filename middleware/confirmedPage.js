const catchAsync = require('../utils/catchAsync');
module.exports = catchAsync(async (req, res, next) => {
    const { user, authorId } = req.body;
    if (user._id !== authorId) {
        user.frogcoins += 1;
        user.save();
    }
    next();
});