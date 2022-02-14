const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');

const sendEmail = async options => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    }
  });

  const handlebarOptions = {
    viewEngine: {
      partialsDir: path.resolve('./'),
      defaultLayout: false,
    },
    viewPath: path.resolve('./'),
  };

  transport.use('compile', hbs(handlebarOptions));

  const mailOptions = {
    from: 'Storybuilder <gmiki91@gmail.com>',
    to: options.email,
    subject: options.subject,
    template: 'emailTemp',
    context:{
      message:options.message,
      userName:options.userName
    },
  }

  await transport.sendMail(mailOptions);
}

module.exports = sendEmail;