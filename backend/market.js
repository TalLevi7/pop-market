// routes/market.js

const express = require('express');
const router = express.Router();
const db = require('./db');             // your MySQL connection/export
const authenticate = require('./authenticate');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// configure AWS SDK v3 S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// use multer memory storage to get file buffer
const upload = multer({ storage: multer.memoryStorage() });


// ------------------------------------------------------------
// GET /api/market
// Return all approved & active listings, with per-seller avg_rating & review_count.
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.market_id,
        m.pop_id,
        COALESCE(p.pop_name, m.custom_pop_name)           AS pop_name,
        COALESCE(p.serial_number, m.custom_serial_number) AS serial_number,
        p.category,
        m.price,
        m.date_uploaded,
        m.market_picture,
        m.market_picture2,
        m.market_picture3,
        m.details,
        m.location,
        u.user_id        AS seller_id,
        u.username       AS seller_username,
        u.email          AS seller_email,
        u.phone_number   AS seller_phone,
        COALESCE(s.avg_rating, 0)   AS avg_rating,
        COALESCE(s.review_count, 0) AS review_count
      FROM market m
      LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
      JOIN users u            ON m.seller_id = u.user_id
      LEFT JOIN (
        SELECT
          mf.seller_id,
          ROUND(AVG(mf.rating),1)    AS avg_rating,
          COUNT(*)                   AS review_count
        FROM market_feedback mf
        WHERE mf.approved = 1
        GROUP BY mf.seller_id
      ) AS s ON u.user_id = s.seller_id
      WHERE m.approved = TRUE
        AND m.status   = 'active'
      ORDER BY m.date_uploaded DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching market listings:', err);
    res.status(500).json({ error: 'Could not load market listings' });
  }
});

// ------------------------------------------------------------
// GET /api/market/seller/:id/reviews
// Return all approved reviews for a given seller (across all their listings)
// ------------------------------------------------------------
router.get('/seller/:id/reviews', async (req, res) => {
  const sellerId = parseInt(req.params.id, 10);
  try {
    const [rows] = await db.execute(`
      SELECT
        mf.feedback_id,
        mf.rating,
        mf.review,
        mf.created_at,
        u.username AS buyer_username
      FROM market_feedback mf
      JOIN users u ON mf.buyer_id = u.user_id
      WHERE mf.seller_id = ?
        AND mf.approved = 1
      ORDER BY mf.created_at DESC
    `, [sellerId]);

    // compute overall average & count
    let avg = 0, count = rows.length;
    if (count > 0) {
      avg = (rows.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1);
    }
    res.json({ reviews: rows, avg_rating: parseFloat(avg), review_count: count });
  } catch (err) {
    console.error('Error fetching seller reviews:', err);
    res.status(500).json({ error: 'Could not load seller reviews' });
  }
});

// ------------------------------------------------------------
// POST /api/market
// Create a new listing, upload image to S3, store its URL.
// Expects multipart/form-data with up to 3 files in field "images"
// ------------------------------------------------------------
router.post(
  '/',
  authenticate,
  upload.array('images', 3),
  async (req, res) => {
    const sellerId = req.user.id;
    const {
      not_in_catalog,
      pop_id,
      custom_pop_name,
      custom_serial_number,
      price,
      location,
      details
    } = req.body;

    // 1) Upload up to 3 files to S3
    const urls = [null, null, null];
    try {
      for (let i = 0; i < (req.files || []).length; i++) {
        const file = req.files[i];
        const key  = `market-images/${Date.now()}_${i}_${file.originalname}`;
        const cmd  = new PutObjectCommand({
          Bucket:      process.env.BUCKET_NAME,
          Key:         key,
          Body:        file.buffer,
          ContentType: file.mimetype,
        });
        await s3.send(cmd);
        urls[i] = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      }
    } catch (err) {
      console.error('S3 upload failed:', err);
      return res.status(500).json({ error: 'Failed to upload images' });
    }

    // 2) Validate inputs
    if (not_in_catalog === 'true') {
      if (!custom_pop_name?.trim()) {
        return res.status(400).json({ error: 'Missing custom_pop_name' });
      }
    } else {
      if (!pop_id) {
        return res.status(400).json({ error: 'Missing pop_id' });
      }
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (!location?.trim()) {
      return res.status(400).json({ error: 'Missing location' });
    }

    // 3) INSERT into market with all three picture columns
    const sql = not_in_catalog === 'true'
      ? `INSERT INTO market
          (pop_id, seller_id, price, location, market_picture, market_picture2, market_picture3, details, status, approved, custom_pop_name, custom_serial_number)
        VALUES
          (NULL, ?, ?, ?, ?, ?, ?, ?, 'active', FALSE, ?, ?)`
      : `INSERT INTO market
          (pop_id, seller_id, price, location, market_picture, market_picture2, market_picture3, details, status, approved, custom_pop_name, custom_serial_number)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, 'active', FALSE, NULL, NULL)`;

    const params = not_in_catalog === 'true'
      ? [
          sellerId,
          parseFloat(price).toFixed(2),
          location,
          urls[0],
          urls[1],
          urls[2],
          details || null,
          custom_pop_name.trim(),
          custom_serial_number?.trim() || null
        ]
      : [
          parseInt(pop_id, 10),
          sellerId,
          parseFloat(price).toFixed(2),
          location,
          urls[0],
          urls[1],
          urls[2],
          details || null
        ];

    try {
      const [result] = await db.execute(sql, params);
      res.status(201).json({ market_id: result.insertId });
    } catch (err) {
      console.error('Error inserting new listing:', err);
      res.status(500).json({ error: 'Database error creating listing' });
    }
  }
);

// ------------------------------------------------------------
// GET /api/market/:id/reviews
// Return all approved reviews for a single listing
// ------------------------------------------------------------
router.get('/:id/reviews', async (req, res) => {
  const marketId = parseInt(req.params.id, 10);
  try {
    const [rows] = await db.execute(`
      SELECT
        feedback_id,
        buyer_id,
        rating,
        review,
        created_at
      FROM market_feedback
      WHERE market_id = ?
        AND approved = 1
      ORDER BY created_at DESC
    `, [marketId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Could not load reviews' });
  }
});

// ------------------------------------------------------------
// POST /api/market/:id/feedback
// Submit a new feedback (pending approval)
// ------------------------------------------------------------
router.post(
  '/:id/feedback',
  authenticate,
  async (req, res) => {
    const buyerId  = req.user.id;
    const marketId = parseInt(req.params.id, 10);
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    try {
      // prevent duplicate per listing
      const [exists] = await db.execute(
        `SELECT 1 FROM market_feedback WHERE market_id = ? AND buyer_id = ?`,
        [marketId, buyerId]
      );
      if (exists.length) {
        return res.status(400).json({ error: 'You already reviewed this listing' });
      }

      // find seller_id
      const [mkt] = await db.execute(
        `SELECT seller_id FROM market WHERE market_id = ?`,
        [marketId]
      );
      if (!mkt.length) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      const sellerId = mkt[0].seller_id;

      // insert feedback
      await db.execute(
        `INSERT INTO market_feedback
           (market_id, buyer_id, seller_id, rating, review)
         VALUES (?, ?, ?, ?, ?)`,
        [marketId, buyerId, sellerId, rating, review || null]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error creating feedback:', err);
      res.status(500).json({ error: 'Could not submit feedback' });
    }
  }
);

// ------------------------------------------------------------
// GET /api/market/my
// Return all active listings for the authenticated user
// ------------------------------------------------------------
router.get(
  '/my',
  authenticate,
  async (req, res) => {
    const userId = req.user.id;
    try {
      const [rows] = await db.execute(
        `
        SELECT
          m.market_id,
          COALESCE(p.pop_name, m.custom_pop_name)    AS pop_name,
          COALESCE(p.serial_number, m.custom_serial_number) AS serial_number,
          m.price,
          m.location,
          m.market_picture,
          m.market_picture2,
          m.market_picture3,
          m.details,
          m.date_uploaded,
          m.status
        FROM market m
        LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
        WHERE m.seller_id = ?
          AND m.status = 'active'
        ORDER BY m.date_uploaded DESC
        `,
        [userId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching user listings:', err);
      res.status(500).json({ error: 'Could not load your listings' });
    }
  }
);

// ------------------------------------------------------------
// PATCH /api/market/:id
// Update a listing’s status (e.g. mark as sold/removed)
// ------------------------------------------------------------
router.patch(
  '/:id',
  authenticate,
  async (req, res) => {
    const userId = req.user.id;
    const marketId = parseInt(req.params.id, 10);
    const { status } = req.body;

    // allow 'active','sold','removed','archived'
    if (!['active','sold','removed','archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
      // verify ownership
      const [existing] = await db.execute(
        `SELECT seller_id FROM market WHERE market_id = ?`,
        [marketId]
      );
      if (!existing.length) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      if (existing[0].seller_id !== userId) {
        return res.status(403).json({ error: 'Not your listing' });
      }

      // update
      await db.execute(
        `UPDATE market SET status = ? WHERE market_id = ?`,
        [status, marketId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating listing status:', err);
      res.status(500).json({ error: 'Could not update listing' });
    }
  }
);

module.exports = router;
