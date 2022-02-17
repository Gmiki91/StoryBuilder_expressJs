const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);
    const message = `Duplicate field value: ${value[0]}. Please use another value.`
    return new AppError(message,400);
}

const handleValidationErrodDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message,400);
}


const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error('ERROR 🔥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // if (process.env.NODE_ENV === 'production') {
        // let error = { ...err };
        // if (err.name === 'CastError') error = handleCastErrorDB(err);
        // if(err.name==='ValidationError') error=handleValidationErrodDB(err);
        // if(err.name==='JsonWebTokenError') err=new AppError('Invalid token, please log in again!', 401);
        // if(err.name==='TokenExpriedError') err=new AppError('Token expired, please log in again!', 401);
        // if(err.code===11000) error=handleDuplicateFieldsDB(err);
        // sendErrorProd(error, res);
    // } else if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    // }

}