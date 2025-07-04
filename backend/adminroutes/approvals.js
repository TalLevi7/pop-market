// backend/adminroutes/approvals.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendEmail } = require('../emailService');

// GET /api/admin/approvals
// List all listings awaiting approval
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.market_id,
        m.pop_id,
        m.custom_pop_name,
        m.custom_serial_number,
        COALESCE(p.pop_name, m.custom_pop_name)       AS pop_name,
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
router.patch('/:id', async (req, res) => {
  const marketId = parseInt(req.params.id, 10);
  const { action, pop_id } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    console.log(`🔔 Approval requested: marketId=${marketId}, action=${action}, pop_id_param=${pop_id}`);

    // 1) Mark approved or removed
    if (action === 'approve') {
      if (pop_id) {
        await db.execute(
          `UPDATE market
             SET pop_id   = ?,
                 approved = TRUE
           WHERE market_id = ?`,
          [parseInt(pop_id, 10), marketId]
        );
        console.log(`✅ market ${marketId} approved and linked to pop_id=${pop_id}`);
      } else {
        await db.execute(
          `UPDATE market
             SET approved = TRUE
           WHERE market_id = ?`,
          [marketId]
        );
        console.log(`✅ market ${marketId} approved without relink`);
      }

      // 2) Load actual pop_id + pop_name from the updated row
      const [[popRow]] = await db.execute(
        `SELECT
           m.pop_id,
           COALESCE(p.pop_name, m.custom_pop_name) AS pop_name
         FROM market m
         LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
        WHERE m.market_id = ?`,
        [marketId]
      );
      const actualPopId = popRow.pop_id;
      const popName     = popRow.pop_name;
      console.log(`▶️ post-approval pop_id=${actualPopId}, pop_name="${popName}"`);

      // 3) Find verified users who wishlisted this pop
      const [wishRows] = await db.execute(
        `SELECT u.user_id, u.email
           FROM wishlist w
           JOIN users u ON w.user_id = u.user_id
          WHERE w.pop_id = ?
            AND u.is_verified = 1`,
        [actualPopId]
      );
      console.log(`ℹ️ Found ${wishRows.length} users to notify:`, wishRows.map(w => w.email));

      // 4) Send each a notification email
      for (const { email } of wishRows) {
        console.log(`✉️  Sending notification to ${email}`);
        const subject    = `Your wish-listed Funko Pop is now on the market!`;
        const marketLink = `${process.env.FRONTEND_URL}/market`;
        const html = `
          <p>Good news!</p>
          <p>The Funko POP <strong>${popName}</strong> from your wish list
          has just been posted for sale on <a href="${marketLink}">the market</a>.</p>
          <p>Click <a href="${marketLink}">here</a> to view all listings.</p>
        `;
        const text = `
Good news!
The Funko POP "${popName}" from your wish list
has just been posted for sale on the market.
Visit: ${marketLink}
        `;
        try {
          await sendEmail({ to: email, subject, html, text });
          console.log(`   ✔️  Sent to ${email}`);
        } catch (mailErr) {
          console.error(`   ❌  Failed to send to ${email}:`, mailErr);
        }
      }
    } else {
      // Reject path
      await db.execute(
        `UPDATE market
           SET status = 'removed'
         WHERE market_id = ?`,
        [marketId]
      );
      console.log(`❌ market ${marketId} marked removed`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Admin approval update error:', err);
    res.status(500).json({ error: 'Could not update listing' });
  }
});

module.exports = router;
