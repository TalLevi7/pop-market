// backend/adminroutes/catalog.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/admin/catalog
// List all catalog entries (now with picture)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        pop_id,
        serial_number,
        pop_name,
        category,
        sub_category,
        release_year,
        picture
      FROM pop_catalog
      ORDER BY pop_name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin catalog GET error:', err);
    res.status(500).json({ error: 'Could not load catalog' });
  }
});

// POST /api/admin/catalog
// Add a new Funko Pop (with picture)
router.post('/', async (req, res) => {
  const {
    pop_name, serial_number,
    category, sub_category,
    release_year, picture
  } = req.body;
  if (!pop_name?.trim()) {
    return res.status(400).json({ error: 'pop_name is required' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO pop_catalog
         (pop_name, serial_number, category, sub_category, release_year, picture)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pop_name.trim(),
        serial_number.trim()   || null,
        category.trim()        || null,
        sub_category.trim()    || null,
        release_year 
          ? parseInt(release_year, 10) 
          : null,
        picture?.trim()        || null
      ]
    );
    res.status(201).json({ pop_id: result.insertId });
  } catch (err) {
    console.error('Admin catalog POST error:', err);
    res.status(500).json({ error: 'Could not add catalog entry' });
  }
});

// PUT /api/admin/catalog/:id
// Edit an existing Funko Pop (incl. picture)
router.put('/:id', async (req, res) => {
  const popId = parseInt(req.params.id, 10);
  const {
    pop_name, serial_number,
    category, sub_category,
    release_year, picture
  } = req.body;
  if (!pop_name?.trim()) {
    return res.status(400).json({ error: 'pop_name is required' });
  }
  try {
    await db.execute(
      `UPDATE pop_catalog
         SET pop_name     = ?,
             serial_number = ?,
             category      = ?,
             sub_category  = ?,
             release_year  = ?,
             picture       = ?
       WHERE pop_id = ?`,
      [
        pop_name.trim(),
        serial_number.trim()   || null,
        category.trim()        || null,
        sub_category.trim()    || null,
        release_year 
          ? parseInt(release_year, 10) 
          : null,
        picture?.trim()        || null,
        popId
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Admin catalog PUT error:', err);
    res.status(500).json({ error: 'Could not update catalog entry' });
  }
});

// DELETE /api/admin/catalog/:id
router.delete('/:id', async (req, res) => {
  const popId = parseInt(req.params.id, 10);
  try {
    await db.execute(`DELETE FROM pop_catalog WHERE pop_id = ?`, [popId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin catalog DELETE error:', err);
    res.status(500).json({ error: 'Could not delete catalog entry' });
  }
});

module.exports = router;
