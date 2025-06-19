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
        m.details,
        m.location,
        u.username   AS seller_username,
        u.email      AS seller_email
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
// Expects multipart/form-data with:
//  • not_in_catalog ("true"/"false")
//  • pop_id (if not_in_catalog=false)
//  • custom_pop_name & custom_serial_number (if not_in_catalog=true)
//  • price, location, details
//  • image (file upload)
// ------------------------------------------------------------
router.post(
  '/',
  authenticate,
  upload.single('image'),
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

    // 1) Upload to S3 if an image was provided
    let imageUrl = null;
    if (req.file) {
      const key = `market-images/${Date.now()}_${req.file.originalname}`;
      try {
        // Note: ACL removed because bucket enforces owner-only
        const command = new PutObjectCommand({
          Bucket:      process.env.BUCKET_NAME,
          Key:         key,
          Body:        req.file.buffer,
          ContentType: req.file.mimetype
        });
        await s3.send(command);

        // Construct the public URL (bucket policy allows public read)
        imageUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      } catch (err) {
        console.error('S3 upload failed:', err);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
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

    // 3) Build and execute INSERT
    let sql, params;
    if (not_in_catalog === 'true') {
      sql = `
        INSERT INTO market
          (pop_id, seller_id, price, location, market_picture, details, status, approved, custom_pop_name, custom_serial_number)
        VALUES
          (NULL, ?, ?, ?, ?, ?, 'active', FALSE, ?, ?)
      `;
      params = [
        sellerId,
        parseFloat(Number(price).toFixed(2)),
        location,
        imageUrl,
        details || null,
        custom_pop_name.trim(),
        custom_serial_number?.trim() || null
      ];
    } else {
      sql = `
        INSERT INTO market
          (pop_id, seller_id, price, location, market_picture, details, status, approved, custom_pop_name, custom_serial_number)
        VALUES
          (?, ?, ?, ?, ?, ?, 'active', FALSE, NULL, NULL)
      `;
      params = [
        parseInt(pop_id, 10),
        sellerId,
        parseFloat(Number(price).toFixed(2)),
        location,
        imageUrl,
        details || null
      ];
    }

    try {
      const [result] = await db.execute(sql, params);
      res.status(201).json({ market_id: result.insertId });
    } catch (err) {
      console.error('Error inserting new listing:', err);
      res.status(500).json({ error: 'Database error creating listing' });
    }
  }
);

module.exports = router;
