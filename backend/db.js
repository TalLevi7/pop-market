// pop-market/backend/db.js
require('dotenv').config();
const mysql = require('mysql2');

// const isAWS = process.env.USE_AWS === "true"; // Switch between AWS and Local

const isAWS = true; // Always use AWS

// Create a connection pool (callback style)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optionally handle any pool-level errors
pool.on('error', err => {
  console.error('MySQL pool error', err);
});

// Export a promise-based pool for async/await if desired
module.exports = pool.promise();