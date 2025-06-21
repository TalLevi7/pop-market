// backend/adminroutes/market.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all listings (any status)
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
        m.status,
        m.date_uploaded
      FROM market m
      LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
      ORDER BY m.date_uploaded DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin market list error:', err);
    res.status(500).json({ error: 'Could not load listings' });
  }
});

// PUT → update price/location/details
router.put('/:id', async (req, res) => {
  const marketId = parseInt(req.params.id, 10);
  const { price, location, details } = req.body;
  try {
    await db.execute(
      `UPDATE market
         SET price    = ?,
             location = ?,
             details  = ?
       WHERE market_id = ?`,
      [parseFloat(price).toFixed(2), location, details || null, marketId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin market edit error:', err);
    res.status(500).json({ error: 'Could not update listing' });
  }
});

// DELETE → remove the listing
router.delete('/:id', async (req, res) => {
  const marketId = parseInt(req.params.id, 10);
  try {
    await db.execute(`DELETE FROM market WHERE market_id = ?`, [marketId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin market delete error:', err);
    res.status(500).json({ error: 'Could not delete listing' });
  }
});

module.exports = router;
