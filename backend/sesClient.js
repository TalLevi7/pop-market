// backend/sesClient.js
// AWS SES - mail service
require('dotenv').config();  
const { SESClient } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: process.env.REGION,              // was AWS_REGION
  credentials: {
    accessKeyId:     process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  }
});

module.exports = { sesClient };
