// backend/emailService.js

require('dotenv').config();
const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesClient } = require('./sesClient');

/**
 * sendEmail sends a transactional email via SES.
 * @param {string} to      – recipient email address
 * @param {string} subject – email subject
 * @param {string} html    – HTML version of the body
 * @param {string} text    – plaintext version
 */
async function sendEmail({ to, subject, html, text }) {
  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: html
        },
        Text: {
          Charset: 'UTF-8',
          Data: text
        }
      }
    },
    Source: process.env.SES_FROM_EMAIL
  };

  await sesClient.send(new SendEmailCommand(params));
}

module.exports = { sendEmail };
