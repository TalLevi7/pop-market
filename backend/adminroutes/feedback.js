// backend/adminroutes/feedback.js
const express      = require('express');
const router       = express.Router();
const authenticate = require('../authenticate');
const db           = require('../db');

// require login + admin flag
router.use(authenticate);
router.use((req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
});

// GET /api/admin/feedback
// List all feedback entries (newest first)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        mf.feedback_id,
        mf.market_id,
        mf.buyer_id,
        b.username AS buyer_username,
        mf.seller_id,
        s.username AS seller_username,
        mf.rating,
        mf.review,
        mf.created_at,
        mf.approved
      FROM market_feedback mf
      JOIN users b ON mf.buyer_id  = b.user_id
      JOIN users s ON mf.seller_id = s.user_id
      ORDER BY mf.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin feedback GET error:', err);
    res.status(500).json({ error: 'Could not load feedbacks' });
  }
});

// PATCH /api/admin/feedback/:id
// Approve or reject a feedback
router.patch('/:id', async (req, res) => {
  const id       = parseInt(req.params.id, 10);
  const approved = req.body.approved ? 1 : 0;
  try {
    await db.execute(
      `UPDATE market_feedback SET approved = ? WHERE feedback_id = ?`,
      [approved, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin feedback PATCH error:', err);
    res.status(500).json({ error: 'Could not update feedback' });
  }
});

// PUT /api/admin/feedback/:id
// Edit rating or review text
router.put('/:id', async (req, res) => {
  const id     = parseInt(req.params.id, 10);
  const { rating, review } = req.body;
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }
  try {
    await db.execute(
      `UPDATE market_feedback SET rating = ?, review = ? WHERE feedback_id = ?`,
      [parseInt(rating,10), review || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin feedback PUT error:', err);
    res.status(500).json({ error: 'Could not update feedback entry' });
  }
});

module.exports = router;
