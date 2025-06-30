// collection.js
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
         pc.collection_id,
         pc.acquired_date,
         p.pop_id,
         p.pop_name,
         p.serial_number,
         p.category,
         p.sub_category,
         p.picture,
         p.release_year,
         p.estimated_price
       FROM personal_collection pc
       JOIN pop_catalog p ON pc.pop_id = p.pop_id
       WHERE pc.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({ error: 'Could not load collection' });
  }
});


// POST /api/collection — add a new pop to the user's collection
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { pop_id: popId } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO personal_collection (user_id, pop_id) VALUES (?, ?)`,
      [userId, popId]
    );

    // success
    res.status(201).json({ message: 'Added to collection' });
  } catch (err) {
    console.error('Error adding to collection:', err);
    res.status(500).json({ error: 'Could not add item' });
  }
});


// DELETE /api/collection/:id
router.delete('/:id', authenticate, async (req, res) => {
  const userId       = req.user.id;
  const collectionId = req.params.id;

  try {
    const [result] = await db.execute(
      `DELETE FROM personal_collection
       WHERE collection_id = ? AND user_id = ?`,
      [collectionId, userId]
    );

    if (result.affectedRows === 0) {
      // nothing was deleted — either wrong ID or not this user's item
      return res.status(404).json({ error: 'Item not found in your collection' });
    }

    // success
    res.json({ message: 'Removed from collection' });
  } catch (err) {
    console.error('Error removing collection item:', err);
    res.status(500).json({ error: 'Could not remove item' });
  }
});


module.exports = router;
