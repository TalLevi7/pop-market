// routes/wishlist.js
const express = require('express');
const router = express.Router();
const db = require('./db');           
const authenticate = require('./authenticate'); 

// GET /api/collection
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id; // assume authenticate sets req.user
  try {
    const [rows] = await db.execute(
      `SELECT 
         pc.wish_id,
         pc.added_date,
         p.pop_id,
         p.pop_name,
         p.serial_number,
         p.category,
         p.sub_category,
         p.picture
       FROM wishlist pc
       JOIN pop_catalog p ON pc.pop_id = p.pop_id
       WHERE pc.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Could not load wishlist' });
  }
});

// POST /api/collection — add a new pop to the user's collection
router.post('/', authenticate, async (req, res) => {
  const { pop_id } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.execute(
      'INSERT INTO wishlist (user_id, pop_id) VALUES (?, ?)',
      [userId, pop_id]
    );
    // success
    res.json({ message: 'Added to wishlist' });

  } catch (err) {
    // catch a duplicate‐entry error:
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already in your wishlist' });
    }
    console.error('Error inserting into wishlist:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// DELETE /api/wishlist/:id
router.delete('/:pop_id', authenticate, async (req, res) => {
  const userId = req.user.id;
  const popId  = req.params.pop_id;

  try {
    const [result] = await db.execute(
      `DELETE FROM wishlist
       WHERE pop_id = ? AND user_id = ?`,
      [popId, userId]
    );

    if (result.affectedRows === 0) {
      // No rows deleted - either wrong pop_id or not this user’s item
      return res.status(404).json({ error: 'Item not found in your wishlist' });
    }

    // success
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing wishlist item:', err);
    res.status(500).json({ error: 'Could not remove item' });
  }
});


module.exports = router;
