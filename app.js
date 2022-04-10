const express = require('express');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');

const app = express();
// const port = process.env.EXPRESS_PORT || 3030;
const limiter = rateLimit({
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests. Please try again in an hour'
});

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const storyRoute = require('./routes/storyRoute');
const userRoute = require('./routes/userRoute');
const pageRoute = require('./routes/pageRoute');
const notificationRoute = require('./routes/notificationRoute');

process.on('uncaughtException', err => {
    console.log('Uncaught exception. Shutting down...')
    process.exit(1);
})

//set security http headers
app.use(helmet());

//CORS
const corsOptions = {
    origin: ['http://localhost:4200', 'https://www.glyphses.com'],
    optionsSuccessStatus: 200 // For legacy browser support
}
app.use(cors(corsOptions));


//Body parser, reading data from body to req.body, limiting its size
app.use(express.json({ limit: '50kb' }));

//Data sanitization against 
app.use(mongoSanitize()); //NoSQL query injection
app.use(xss()); //XSS 
app.use(hpp()); //parameter pollution

app.use('/api/users/login', limiter)
app.use('/api/stories', storyRoute);
app.use('/api/users', userRoute);
app.use('/api/pages', pageRoute);
app.use('/api/notifications', notificationRoute);
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler)

//const server = app.listen(port, () => console.log(`Express server listening on port ${port}`))
mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.hakyf.mongodb.net/storybuilder?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to database!");
    });

module.exports = app;
// process.on('unhandledRejection', err => {
//     console.log('Unhandled rejection. Shutting down...')
//     console.log(err.name, err.message, err.stack);
//     server.close(() => {
//         process.exit(1);
//     });
// });


