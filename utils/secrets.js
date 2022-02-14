const ssm = require('./aws-client');

const getSecret = async (secretName) => {
  const params = {
    Name: secretName, 
    WithDecryption: true
  };

  const result = await ssm.getParameter(params).promise();
  return result.Parameter.Value;
};

const dbPw = getSecret('DB_PW');
const emailPW = getSecret('EMAIL_PASSWORD');
const jwtSecret = getSecret('JWT_SECRET');

module.exports = {dbPw,emailPW,jwtSecret};