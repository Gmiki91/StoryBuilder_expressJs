const AWS = require('aws-sdk');
AWS.config.update({region:'eu-central-1'});
const ssm = new AWS.SSM();

module.exports = ssm;