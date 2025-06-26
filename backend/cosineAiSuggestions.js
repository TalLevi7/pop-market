// routes/cosineAiSuggestions.js
// cosine algorithm based AI suggestions for POPs from catalog

const express      = require('express');
const router       = express.Router();
const db           = require('./db');
const authenticate = require('./authenticate');

// Helpers for cosine similarity
const dot  = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const norm = a     => Math.sqrt(a.reduce((sum, x) => sum + x*x, 0));

// GET /api/catalog/ai-suggestions
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    // get user’s owned pop_ids from personal_collection
    const [ownedRows] = await db.execute(
      'SELECT pop_id FROM personal_collection WHERE user_id = ?',
      [userId]
    );
    const ownedIds = ownedRows.map(r => r.pop_id);

    // get user’s wishlist pop_ids
    const [wishRows] = await db.execute(
      'SELECT pop_id FROM wishlist WHERE user_id = ?',
      [userId]
    );
    const wishIds = wishRows.map(r => r.pop_id);

    // if user owns nothing, no suggestions
    if (!ownedIds.length) return res.json([]);

    // load all pops from pop_catalog
    const [allPops] = await db.query(`
      SELECT pop_id, pop_name, serial_number,
             category, sub_category, picture, release_year
      FROM pop_catalog
    `);

    // build vocabulary of category, sub-category and release-year
    const cats   = [...new Set(allPops.map(p => p.category))];
    const subs   = [...new Set(allPops.map(p => p.sub_category))];
    const years  = allPops.map(p => p.release_year || 0);
    const minY   = Math.min(...years), maxY = Math.max(...years);
    const rangeY = maxY - minY || 1;

    // vectorize all pops
    const vecs = {};
    allPops.forEach(p => {
      const v = [];
      // category weight = 1
      cats.forEach(c => v.push(p.category === c ? 1 : 0));
      // sub_category weight = 1.5
      subs.forEach(s => v.push(p.sub_category === s ? 1.5 : 0));
      // normalized release_year weight = 0.75
      v.push((((p.release_year || minY) - minY) / rangeY) * 0.75 );
      vecs[p.pop_id] = v;
    });

    // for each candidate not owned or wished, avg cosine against each owned
    const candidates = allPops.filter(
      p => !ownedIds.includes(p.pop_id) && !wishIds.includes(p.pop_id)
    );
    const scored = candidates.map(p => {
      const v1 = vecs[p.pop_id];
      let sum = 0;
      ownedIds.forEach(id => {
        const v2 = vecs[id];
        const m  = norm(v1)*norm(v2) || 1;
        sum += dot(v1, v2) / m;
      });
      return { ...p, score: sum / ownedIds.length };
    });

    // sort desc & return top10 (strip score)
    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10).map(({ score, ...pop }) => pop);
    res.json(top10);

  } catch(err) {
    console.error('AI suggestions error:', err);
    res.status(500).json({ error: 'Could not compute recommendations' });
  }
});

module.exports = router;

