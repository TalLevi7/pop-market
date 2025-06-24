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

// ---------- Cosine algorithm AI  recommendations -----------------------------------
router.get('/ai-suggestions', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    // 1) get user’s owned pop_ids
    const [owned] = await db.execute(
      'SELECT pop_id FROM personal_collection WHERE user_id = ?',
      [userId]
    );
    const ownedIds = owned.map(r => r.pop_id);
    if (ownedIds.length === 0) {
      return res.json([]); // no data to compare
    }

    // 2) load all pops
    const [allPops] = await db.query(`
      SELECT pop_id, pop_name, serial_number, category, sub_category,
             picture, release_year
      FROM pop_catalog
    `);

    // 3) build vocabulary of categories & sub-cats
    const cats   = [...new Set(allPops.map(p => p.category))];
    const subs   = [...new Set(allPops.map(p => p.sub_category))];
    const years  = allPops.map(p => p.release_year || 0);
    const minY   = Math.min(...years), maxY = Math.max(...years);
    const rangeY = maxY - minY || 1;

    // 4) vectorize all pops
    const vecs = {};
    allPops.forEach(p => {
      const v = [];
      // one-hot category
      cats.forEach(c => v.push(p.category === c ? 1 : 0));
      // weighted one-hot sub_category
      subs.forEach(s => v.push(p.sub_category === s ? 2 : 0));
      // normalized year
      v.push(((p.release_year||minY) - minY) / rangeY);
      vecs[p.pop_id] = v;
    });

    // dot & norm helpers
    const dot  = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
    const norm = a    => Math.sqrt(a.reduce((s,x)=>s+x*x,0));

    // 5) for each candidate not owned, avg cosine against each owned
    const candidates = allPops.filter(p => !ownedIds.includes(p.pop_id));
    const scored = candidates.map(p => {
      const v1 = vecs[p.pop_id];
      let sum = 0;
      ownedIds.forEach(id => {
        const v2 = vecs[id];
        const d  = dot(v1,v2);
        const m  = norm(v1)*norm(v2)||1;
        sum += d/m;
      });
      return { ...p, score: sum/ownedIds.length };
    });

    // 6) sort desc & return top5 (we strip the score)
    scored.sort((a,b)=>b.score - a.score);
    const top5 = scored.slice(0,5).map(({score, ...pop}) => pop);
    res.json(top5);

  } catch(err) {
    console.error('AI suggestions error:', err);
    res.status(500).json({ error: 'Could not compute recommendations' });
  }
});

module.exports = router;
