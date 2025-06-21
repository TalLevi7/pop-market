// backend/adminroutes/approvals.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/approvals
// List all listings awaiting approval
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.market_id,
        COALESCE(p.pop_name, m.custom_pop_name)    AS pop_name,
        COALESCE(p.serial_number, m.custom_serial_number) AS serial_number,
        m.price,
        m.location,
        m.details,
        m.date_uploaded,
        u.username AS seller_username
      FROM market m
      LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
      JOIN users u           ON m.seller_id = u.user_id
      WHERE m.approved = FALSE
        AND m.status   = 'active'
      ORDER BY m.date_uploaded ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin approvals list error:', err);
    res.status(500).json({ error: 'Could not load approval queue' });
  }
});

// PATCH /api/admin/approvals/:id
// Approve or reject a listing
router.patch('/:id', async (req, res) => {
  const marketId = parseInt(req.params.id, 10);
  const { action } = req.body; // "approve" or "reject"

  if (!['approve','reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    if (action === 'approve') {
      await db.execute(
        `UPDATE market SET approved = TRUE WHERE market_id = ?`,
        [marketId]
      );
    } else {
      // reject → remove from active queue
      await db.execute(
        `UPDATE market SET status = 'removed' WHERE market_id = ?`,
        [marketId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Admin approval update error:', err);
    res.status(500).json({ error: 'Could not update listing' });
  }
});

module.exports = router;
