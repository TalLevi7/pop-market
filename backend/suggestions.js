// backend/routes/suggestions.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db      = require('./db');
require('dotenv').config();

// configure AWS SDK v3 S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// multer for optional image upload
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/suggestions
// Accepts both guests and logged-in users
router.post('/', upload.single('image'), async (req, res) => {
  // decode JWT if provided
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.user_id;
    } catch (err) {
      // invalid token - treat as guest
    }
  }

  // 2) pull form fields
  const { pop_name, serial_number, release_date, details } = req.body;
  if (!pop_name?.trim()) {
    return res.status(400).json({ error: 'Pop name is required' });
  }

  // 3) upload image if present
  let imageUrl = null;
  if (req.file) {
    const key = `pop-suggestions/${Date.now()}_${req.file.originalname}`;
    try {
      await s3.send(new PutObjectCommand({
        Bucket:      process.env.BUCKET_NAME,
        Key:         key,
        Body:        req.file.buffer,
        ContentType: req.file.mimetype
      }));
      imageUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (err) {
      console.error('S3 upload failed:', err);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  }

  // 4) insert into pop_suggestions
  try {
    const [result] = await db.execute(
      `INSERT INTO pop_suggestions
         (user_id, pop_name, serial_number, details, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        pop_name.trim(),
        serial_number?.trim()  || null,
        details?.trim()       || null,
        imageUrl
      ]
    );
    res.status(201).json({ suggestion_id: result.insertId });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Could not save suggestion' });
  }
});

module.exports = router;
