const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user')
module.exports = catchAsync(async(req, res, next)=> {
   let token;

    if( req.headers.authorization &&  req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
        return next(new AppError('You must be logged in to get access!', 401));
    }

    const decoded = jwt.verify(token,process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if(!user){
        return next(new AppError('User does not exists!', 401));
    }
    
    const passwordChanged = user.changedPasswordAfter(decoded.iat);
    if(passwordChanged){
        return next(new AppError('Password has been changed. Log in again!',401));
    }
    req.body.user = user;
    next();
});