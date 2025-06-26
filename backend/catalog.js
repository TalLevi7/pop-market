// routes/catalog.js
const express      = require('express');
const router       = express.Router();
const db           = require('./db');
const authenticate = require('./authenticate');

// Fetch the whole catalog
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pop_catalog');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching catalog:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Mount the cosine-based AI suggestions under /api/catalog/ai-suggestions
router.use('/ai-suggestions', require('./CosineAiSuggestions'));

// Mount the KNN-based AI suggestions under /api/catalog/ai-suggestions
// router.use('/ai-suggestions', require('./knnAiSuggestions'));

module.exports = router;
