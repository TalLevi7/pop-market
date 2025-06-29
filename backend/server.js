// server.js
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const db = require('./db');               // your MySQL connection
const jwt = require('jsonwebtoken');      // for JWT verification
const authenticate = require('./authenticate'); // your auth middleware



const app = express();


// For debugging DB connection on production
// app.get('/api/ping', async (req, res) => {
//   const mysql = require('mysql2/promise');
//   try {
//     const conn = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASS,
//       database: process.env.DB_NAME,
//       port: +process.env.DB_PORT,
//     });
//     await conn.query('SELECT 1');
//     await conn.end();
//     console.log('DB connectivity successful');
//     res.json({ status: 'OK', host: process.env.DB_HOST });
//   } catch (e) {
//     console.error('Ping DB failed:', e);
//     res.status(500).json({ status: 'FAIL', error: e.message });
//   }
// });


// updated cors to allow requests from different origins
const allowedOrigins = [
  'https://popmarketproject.com',
  'https://www.popmarketproject.com',
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// for local running use:
// app.use(cors())

app.use(express.json());





// updates catalog prices every 24 hours
require('./api/updateApiPrices');

// ---------------------
// Routes
// ---------------------
const catalogRoutes = require('./catalog');
const collectionRoutes = require('./collection');
const wishlistRoutes   = require('./wishlist');
const marketRoutes   = require('./market');
const contactRouter = require('./contact');
const userRouter = require('./user');
const suggestionsRouter = require('./suggestions');

app.use('/api/catalog', catalogRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/contact', contactRouter);
app.use('/api/user', userRouter);
app.use('/api/suggestions', suggestionsRouter);


// Admin-only routes
const adminRoutes = require('./adminroutes/admin');
app.use('/api/admin', adminRoutes);


// Root Route (for testing)
app.get('/', (req, res) => {
  res.send('Pop Market API is running!');
});


// Import signup and login handlers
const { signup } = require('./signup');
const { login } = require('./login');
// Public auth routes
app.post('/api/signup', signup);
app.post('/api/login', login);



// Fetch 6 latest active items in Market
app.get('/api/latest_market', async (req, res) => {
  const sql = `
    SELECT m.*, p.pop_name, p.picture
    FROM market m
    JOIN pop_catalog p ON m.pop_id = p.pop_id
    WHERE m.status = 'active'
    ORDER BY m.market_id DESC
    LIMIT 6
  `;
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching latest market items:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});



// ---------------------
// Start Server
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
