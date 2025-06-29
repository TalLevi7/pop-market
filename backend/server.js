// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');               // your MySQL connection
const jwt = require('jsonwebtoken');      // for JWT verification
const authenticate = require('./authenticate'); // your auth middleware

require('dotenv').config();

const app = express();
app.use(express.json());

// updated cors to allow requests from different origins
const allowedOrigins = [
  'https://popmarketproject.com',
  'https://www.popmarketproject.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // if using cookies or authorization headers
}));

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


// Global error handler (should be last middleware)
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});


// ---------------------
// Start Server
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
