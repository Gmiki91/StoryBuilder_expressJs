const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const user = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, 'Please enter your name'],
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please enter your email address'],
    },
    password: {
        type: String,
        minLength: 6,
        select: false,
        required: [true, 'Please enter your password'],
    },
    active: {type: Boolean,default: true},
    confirmed: { type: Boolean, default: false },
    numberOfTablets: { type: Number, default: 0 },
    markedStoryId: String,
    markedStoryAt: Date,
    lastActivity: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    dailyCompleted: Boolean,
    favoriteStoryIdList: [String],
}, { collection: 'users' })

user.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

user.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    user.passwordChangedAt = Date.now() - 1000; // --- the token might be created faster than the db update, this way we make sure that the token iat is after the passwordChangedAt property
    next();
})

// user.pre(/^find/,function(next){
//     this.find({active:true});
//     next();
// })

user.methods.correctPassword = async function (candidatePw, userPw) {
    return await bcrypt.compare(candidatePw, userPw)
}
user.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

user.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}
module.exports = mongoose.model('User', user);