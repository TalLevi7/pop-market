// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// POST /api/contact
// Accepts both anonymous and signed-in users
router.post('/', async (req, res) => {
  const { name, email, subject, body } = req.body;
  let userId = null;

  // try to extract user_id from Bearer token, if present
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.user_id;
    } catch (e) {
      // invalid token - treat as anonymous
    }
  }

  // validate
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await db.execute(
      `INSERT INTO contact_messages
         (user_id, name, email, subject, body)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        email.trim(),
        subject.trim(),
        body.trim()
      ]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Contact POST error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
