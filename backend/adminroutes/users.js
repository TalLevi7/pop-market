// backend/adminroutes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/users
// List all users, including is_banned flag
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        user_id,
        username,
        email,
        phone_number,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        is_admin,
        is_verified,             
        is_banned
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin users GET error:', err);
    res.status(500).json({ error: 'Could not load users' });
  }
});

// PUT /api/admin/users/:id
// Edit user details (username, email, phone, is_admin, is_verified)
router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { username, email, phone_number, is_admin, is_verified } = req.body; 

  if (!username?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  try {
    await db.execute(
      `UPDATE users
         SET username     = ?,
             email        = ?,
             phone_number = ?,
             is_admin     = ?,
             is_verified  = ?
       WHERE user_id = ?`,
      [
        username.trim(),
        email.trim(),
        phone_number?.trim() || null,
        is_admin    ? 1 : 0,
        is_verified ? 1 : 0,       
        userId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin users PUT error:', err);
    res.status(500).json({ error: 'Could not update user' });
  }
});

// DELETE /api/admin/users/:id
// Remove a user entirely
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    await db.execute(`DELETE FROM users WHERE user_id = ?`, [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin users DELETE error:', err);
    res.status(500).json({ error: 'Could not delete user' });
  }
});

// PATCH /api/admin/users/:id/ban
// Ban or unban a user (soft block)
router.patch('/:id/ban', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const banFlag = req.body.ban ? 1 : 0;
  try {
    await db.execute(
      `UPDATE users
         SET is_banned = ?
       WHERE user_id = ?`,
      [banFlag, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin users BAN error:', err);
    res.status(500).json({ error: 'Could not update ban status' });
  }
});

module.exports = router;
