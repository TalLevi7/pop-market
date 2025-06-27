// routes/catalog.js
const express      = require('express');
const router       = express.Router();
const db           = require('./db');
const authenticate = require('./authenticate');

// Fetch the whole catalog
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT *, estimated_price FROM pop_catalog');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching catalog:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Mount the cosine-based AI suggestions under /api/catalog/ai-suggestions
router.use('/ai-suggestions', require('./cosineAiSuggestions'));

// Mount the KNN-based AI suggestions under /api/catalog/ai-suggestions
// router.use('/ai-suggestions', require('./knnAiSuggestions'));

// KNN- gets nearest neighbors for each owned POP	
// Cosine- compares each candidate POP against all owned POPs



module.exports = router;
