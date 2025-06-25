// backend/adminroutes/suggestions.js

const express      = require('express');
const router       = express.Router();
const authenticate = require('../authenticate');
const db           = require('../db');

// ------- Restrict to logged-in admins ------------------------
router.use(authenticate);
router.use((req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
});

// ---- GET pending suggestions --------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         s.suggestion_id,
         s.pop_name,
         s.serial_number,
         s.details,
         s.image_url,
         DATE_FORMAT(s.created_at, '%d/%m/%Y') AS created_at,
         u.username,
         u.email
       FROM pop_suggestions s
       LEFT JOIN users u ON s.user_id = u.user_id
       WHERE s.status = 'pending'
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin suggestions GET error:', err);
    res.status(500).json({ error: 'Could not load suggestions' });
  }
});

// ---------- PATCH accept/reject suggestions -----------------
router.patch('/:id', async (req, res) => {
  const suggestionId = parseInt(req.params.id, 10);
  const { action }   = req.body; // expect "accept" or "reject"
  if (!['accept','reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  const newStatus = action === 'accept' ? 'accepted' : 'rejected';
  try {
    await db.execute(
      `UPDATE pop_suggestions
         SET status = ?
       WHERE suggestion_id = ?`,
      [newStatus, suggestionId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin suggestions PATCH error:', err);
    res.status(500).json({ error: 'Could not update suggestion' });
  }
});

module.exports = router;
