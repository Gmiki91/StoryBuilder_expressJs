const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generator = require('generate-password');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const signToken = id => jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
);

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user
    });
};

exports.preSignupCheck = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ $or: [{ email: req.body.email }, { name: req.body.name }] })
    const duplicate = user ? true : false;
    res.status(200).json({
        status: 'success',
        duplicate
    });
})

exports.signup = catchAsync(async (req, res, next) => {
    let {name, email, password} = req.body
    if (!password || password==='') password = generator.generate({ length: 10, numbers: true });
    const user = await User.create({
        name: name,
        email: email,
        password: password,
        favoriteStoryIdList: [],
        lastActivity: Date.now(),
        signedUpAt: Date.now()
    });
    createSendToken(user, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const { userInput, password } = req.body;
    const query = userInput.includes('@') ? { email: userInput } : { name: userInput };
    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) return next(new AppError(`Incorrect login credentials.`, 401));
    await user.save();
    createSendToken(user, 200, res);
})

exports.loginGoogle = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (!user ) return next(new AppError(`${email} is not found`, 401));
    createSendToken(user, 200, res);
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.body.user._id).select('+password');
    const { currentPassword, newPassword } = req.body;
    if (!user || !(await user.correctPassword(currentPassword, user.password))) return next(new AppError(`Incorrect password`, 401));

    user.password = newPassword;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();
    createSendToken(user, 201, res);
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    let message;
    let subject;
    if (user) {
        const resetToken = user.createPasswordResetToken();
        //const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        const resetUrl = `https://glyphses.com/reset/${resetToken}`;
        subject = 'Your password reset token (valid for 10 minutes) - Glyphses';
        message = `
        Hello ${user.name}!
        A password reset event has been triggered. The password reset window is limited to 10 minutes.
        To complete the password reset process, visit the following link:
        ${resetUrl}`;
        await user.save();
    } else {
        subject = 'Account access attempted - Glyphses';
        message = `You or someone else entered this email address when trying to change the password of a Glyphses account.
         However, this email address is not in our database.
         If you are a registered user, please try again using the email address you gave when you registered.
         If you are not a registered user, please ignore this email.`;
    }
    try {
        await sendEmail({
            email,
            subject,
            message
        });
        res.status(200).json({
            status: 'success',
            message: `An email has been sent to ${email} with further instructions`
        })
    } catch (err) {
        if (user) {
            user.createPasswordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user?.save();
        }
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
})
exports.resetPassword = catchAsync(async (req, res, next) => {
    const passwordResetToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return next(new AppError('Token is invalid/expired.', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 201, res);
})