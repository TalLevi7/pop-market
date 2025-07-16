// backend/passwordReset.js
const express = require('express');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const { sendEmail } = require('./emailService');
const db      = require('./db');
const router  = express.Router();

// enforce same complexity as signup
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const [rows] = await db.query(
      'SELECT user_id, username FROM users WHERE email = ?',
      [email]
    );
    if (rows.length) {
      const { user_id, username } = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60*60*1000); // 1 hour

      await db.query(
        'UPDATE users SET reset_token = ?, reset_expires = ? WHERE user_id = ?',
        [token, expires, user_id]
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Your password reset link',
        html: `<p>Hi ${username},</p>
               <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        text: `Hi ${username},\nReset your password: ${resetUrl}`
      });
    }

    // Always respond OK
    res.json({ message: 'If that email exists, you’ll receive a reset link shortly.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  // server-side validation
  if (!PASSWORD_REGEX.test(new_password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and include at least one letter and one number.'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT user_id FROM users WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    const { user_id } = rows[0];

    await db.query(
      `UPDATE users
         SET password_hash = ?, reset_token = NULL, reset_expires = NULL
       WHERE user_id = ?`,
      [hashed, user_id]
    );

    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
