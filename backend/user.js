// backend/routes/user.js
const express      = require('express');
const router       = express.Router();
const db           = require('./db');
const authenticate = require('./authenticate');

// GET /api/user
// Return the current user’s profile
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.execute(
      `SELECT 
         username, 
         email, 
         phone_number, 
         notify_wishlist 
       FROM users 
       WHERE user_id = ?`,
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/user error:', err);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// PUT /api/user
// Update the current user’s profile
router.put('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { username, phone_number, notify_wishlist } = req.body;

  if (!username?.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    await db.execute(
      `UPDATE users
         SET username        = ?, 
             phone_number    = ?, 
             notify_wishlist = ?
       WHERE user_id = ?`,
      [
        username.trim(),
        phone_number?.trim() || null,
        notify_wishlist ? 1 : 0,
        userId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/user error:', err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

module.exports = router;
