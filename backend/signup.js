// backend/signup.js

require('dotenv').config();                  // ← ensure this is at your app entry point
const bcrypt = require('bcryptjs');
const crypto = require('crypto');            // ← for token generation
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require('./sesClient'); // ← our helper
const db = require('./db');

// Signup Route Handler
const signup = async (req, res) => {
  const { username, email, password, phone_number } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the email or username already exist
  try {
    const [existingEmail] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    const [existingUsername] = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const insertQuery = `
      INSERT INTO users
        (username, email, password_hash, phone_number)
      VALUES (?, ?, ?, ?)
    `;
    const [insertResult] = await db.query(insertQuery, [
      username,
      email,
      hashedPassword,
      phone_number || null
    ]);

    // ─── Generate & store verification token ────────────────────────
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    await db.query(
      'UPDATE users SET verification_token = ?, verification_expires = ? WHERE user_id = ?',
      [token, expires, insertResult.insertId]
    );

    // ─── Send verification email via SES ───────────────────────────
    const verificationUrl = `${process.env.FRONTEND_URL}/userVerification?token=${token}`;
    const emailParams = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <p>Hi ${username},</p>
              <p>Thanks for signing up! Please verify your email by clicking
              <a href="${verificationUrl}">this link</a>.</p>
              <p>If you didn’t sign up, just ignore this email.</p>
            `
          },
          Text: {
            Charset: "UTF-8",
            Data: `Hi ${username},\nPlease verify your email:\n${verificationUrl}`
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Please verify your email"
        }
      },
      Source: process.env.SES_FROM_EMAIL
    };

    await sesClient.send(new SendEmailCommand(emailParams));

    // Show success message
    res.status(201).json({
      message:
        'User created successfully. Please check your email to verify your account.'
    });

  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup };
