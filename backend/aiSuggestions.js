// backend/routes/aiSuggestions.js
const express      = require('express');
const router       = express.Router();
const db           = require('./db');           // your MySQL pool/export
const authenticate = require('./authenticate');  // your auth middleware

// ------------------------------------------------------------
// GET /api/catalog/ai-suggestions
// Return top-N pops based on weighted KNN over (category, sub_category, release_year).
// Sub-category dimensions get a multiplier >1.
// ------------------------------------------------------------
router.get(
  '/catalog/ai-suggestions',
  authenticate,
  async (req, res) => {
    const userId = req.user.id;

    try {
      // 1) Load user's collection pop_ids
      const [userRows] = await db.execute(
        'SELECT pop_id FROM collection WHERE user_id = ?',
        [userId]
      );
      if (!userRows.length) {
        return res.status(400).json({ error: 'Your collection is empty' });
      }
      const ownedSet = new Set(userRows.map(r => r.pop_id));

      // 2) Load all pops
      const [allPops] = await db.execute(`
        SELECT
          pop_id, pop_name, serial_number,
          category, sub_category, release_year, picture
        FROM pop_catalog
      `);

      // 3) Build feature‐space
      const categories    = Array.from(new Set(allPops.map(p => p.category)));
      const subCategories = Array.from(new Set(allPops.map(p => p.sub_category)));
      const years         = allPops.map(p => p.release_year || 0);
      const minY = Math.min(...years), maxY = Math.max(...years);
      const wSub = 2.5;  // your sub-category weight

      const makeVec = p => {
        // one-hot category
        const catVec = categories.map(c => (p.category === c ? 1 : 0));
        // one-hot subCategory, scaled
        const subVec = subCategories.map(sc =>
          p.sub_category === sc ? 1 * wSub : 0
        );
        // normalized year
        const y = p.release_year || minY;
        const yearNorm = maxY > minY
          ? (y - minY) / (maxY - minY)
          : 0;
        return [...catVec, ...subVec, yearNorm];
      };

      // 4) Compute user centroid
      const userPops = allPops.filter(p => ownedSet.has(p.pop_id));
      const dim = makeVec(userPops[0]).length;
      const centroid = new Array(dim).fill(0);
      userPops.forEach(p => {
        const v = makeVec(p);
        v.forEach((val,i) => centroid[i] += val);
      });
      centroid.forEach((sum,i) => centroid[i] = sum / userPops.length);

      // 5) Cosine similarity helper
      function cosine(a, b) {
        let dot=0, na=0, nb=0;
        for (let i=0; i<a.length; i++) {
          dot += a[i]*b[i];
          na  += a[i]*a[i];
          nb  += b[i]*b[i];
        }
        return na && nb ? dot / (Math.sqrt(na)*Math.sqrt(nb)) : 0;
      }

      // 6) Score & filter out owned, then sort & take top 10
      const suggestions = allPops
        .filter(p => !ownedSet.has(p.pop_id))
        .map(p => ({
          ...p,
          score: cosine(centroid, makeVec(p))
        }))
        .sort((a,b) => b.score - a.score)
        .slice(0, 10)
        .map(({ score, ...p }) => p); // drop score from response

      return res.json(suggestions);
    } catch (err) {
      console.error('AI suggestions error:', err);
      return res.status(500).json({ error: 'Could not compute suggestions' });
    }
  }
);

module.exports = router;
