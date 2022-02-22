const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user');
exports.getMe = (req, res) => {
    res.status(200).json({
        status: 'success',
        user: req.body.user
    });
}
exports.getLekvar = (req, res) => {res.status(201).json({message:"szia Lekvár!"})}
exports.getUser=catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.params.id); 
    res.status(200).json({
        status: 'success',
        user:{
            _id:user._id,
            name:user.name,
            email:user.email,
            lastActivity:user.lastActivity,
            active:user.active
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.body.user._id).select(['+password', 'active']);
    const { deletePassword } = req.body;
    if (!user || !(await user.correctPassword(deletePassword, user.password))) return next(new AppError(`Incorrect password`, 401));
    user.active = false;
    await user.save();
    res.status(201).json({
        status: 'success',
        message: 'User deleted successfully'
    });
})

exports.getFavorites = catchAsync(async (req, res, next) => {
    const user = req.body.user;
    res.status(200).json({
        status: 'success',
        data: user.favoriteStoryIdList
    });
})

exports.addFavorite = catchAsync(async (req, res, next) => {
    const user = req.body.user;
    user.favoriteStoryIdList.push(req.body.storyId);
    await user.save();
    res.status(204).json({
        status: 'success',
        data: null
    });
})

exports.removeFavorite = catchAsync(async (req, res, next) => {
    const user = req.body.user;
    const index = user.favoriteStoryIdList.indexOf(req.body.storyId);
    user.favoriteStoryIdList.splice(index, 1);
    await user.save();
    res.status(204).json({
        status: 'success',
        data: null
    });
})