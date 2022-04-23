const catchAsync = require('../utils/catchAsync');
const User = require('../models/user')
module.exports = catchAsync(async (req, res, next) => {
    const { user, authorId } = req.body;
    if (user._id !== authorId) {
        const author = await User.findById(authorId);
        author.frogcoins += 1;
        author.save();
    }
    next();
});