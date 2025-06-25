// index.js page for multer purposes - storing images in amazon S3 bucket
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const key = Date.now() + '-' + req.file.originalname;
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: 'public-read'
  };
  s3.upload(params, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json({ imageUrl: data.Location });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
