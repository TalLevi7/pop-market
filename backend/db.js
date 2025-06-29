// pop-market/backend/db.js
require('dotenv').config();
const mysql = require('mysql2');

// const isAWS = process.env.USE_AWS === "true"; // Switch between AWS and Local

const isAWS = true; // Always use AWS

console.log ("-RUNTIME \n -DB HOST: ", process.env.DB_HOST, "\n PASSWORD: ", process.env.DB_PASS);

// Create a connection pool (callback style)
const pool = mysql.createPool({
  host: isAWS ? process.env.DB_HOST : process.env.LCL_DB_HOST,
  user: isAWS ? process.env.DB_USER : process.env.LCL_DB_USER,
  password: isAWS ? process.env.DB_PASS : process.env.LCL_DB_PASS,
  database: isAWS ? process.env.DB_NAME : process.env.LCL_DB_NAME,
  port: isAWS ? process.env.DB_PORT : process.env.LCL_DB_PORT,
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