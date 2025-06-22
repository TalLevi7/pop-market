// backend/adminroutes/contactMessages.js

const express = require('express');
const router = express.Router();
const db     = require('../db');

// GET /api/admin/contact-messages
// List all incoming contact form messages, most recent first
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        message_id,
        user_id,
        name,
        email,
        subject,
        body,
        DATE_FORMAT(created_at, '%d/%m/%Y') AS created_at_formatted
      FROM contact_messages
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin contact-messages GET error:', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

// DELETE /api/admin/contact-messages/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await db.execute(`DELETE FROM contact_messages WHERE message_id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin contact-messages DELETE error:', err);
    res.status(500).json({ error: 'Could not delete message' });
  }
});

module.exports = router;
