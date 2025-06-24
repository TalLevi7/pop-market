// backend/adminroutes/admin.js
const express = require('express');
const router = express.Router();
const authenticate = require('../authenticate');

// Middleware: only admins may proceed
function authorizeAdmin(req, res, next) {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }
  next();
}

// Apply to all /api/admin/*
router.use(authenticate, authorizeAdmin);

// Health‐check
router.get('/status', (req, res) => {
  res.json({ ok: true, user: req.user.username });
});

// Mount market‐management subrouter
router.use('/market', require('./market'));
router.use('/approvals', require('./approvals'));
router.use('/catalog',   require('./catalog'));
router.use('/users',     require('./users'));
router.use('/contact-messages', require('./contactMessages'));
router.use('/suggestions', require('./suggestions'));
router.use('/feedback', require('./feedback'));

module.exports = router;
