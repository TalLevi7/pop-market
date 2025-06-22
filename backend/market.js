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
// Return all approved & active listings. If pop_id is NULL, use custom_pop_name/serial.
// ------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.market_id,
        m.pop_id,
        COALESCE(p.pop_name, m.custom_pop_name)        AS pop_name,
        COALESCE(p.serial_number, m.custom_serial_number) AS serial_number,
        p.category,
        m.price,
        m.date_uploaded,
        m.market_picture,
        m.market_picture2,
        m.market_picture3,
        m.details,
        m.location,
        u.username   AS seller_username,
        u.email      AS seller_email,
        u.phone_number AS seller_phone
      FROM market m
      LEFT JOIN pop_catalog p ON m.pop_id = p.pop_id
      JOIN users u             ON m.seller_id = u.user_id
      WHERE m.approved = TRUE
        AND m.status = 'active'
      ORDER BY m.date_uploaded DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching market listings:', err);
    res.status(500).json({ error: 'Could not load market listings' });
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
// Update a listing’s status (e.g. mark as sold)
// ------------------------------------------------------------
router.patch(
  '/:id',
  authenticate,
  async (req, res) => {
    const userId = req.user.id;
    const marketId = parseInt(req.params.id, 10);
    const { status } = req.body;

    // allow 'sold' or 'removed'
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