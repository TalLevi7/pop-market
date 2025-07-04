// backend/userVerification.js
// for email user verification during signup

require('dotenv').config();
const express = require('express');
const db = require('./db');

const router = express.Router();

// GET /api/userVerification?token=...
router.get('/', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Verification token missing.');
  }

  try {
    // Find user by token and check expiry
    const [rows] = await db.query(
      'SELECT user_id, verification_expires FROM users WHERE verification_token = ?',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).send('Invalid verification token.');
    }

    const user = rows[0];
    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).send('Verification token expired.');
    }

    // Mark verified and clear token
    await db.query(
      `UPDATE users
         SET is_verified = 1,
             verification_token = NULL,
             verification_expires = NULL
       WHERE user_id = ?`,
      [user.id]
    );

    // Redirect to frontend “verified” page
    return res.redirect(`${process.env.FRONTEND_URL}/verified`);
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).send('Server error during verification.');
  }
});

module.exports = router;
