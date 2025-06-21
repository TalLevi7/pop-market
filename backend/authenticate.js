const jwt = require('jsonwebtoken');
const db  = require('./db'); // MySQL connection

// Auth middleware: verifies JWT and checks ban status
module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // new: Check if user has been banned since token issuance
    const [[row]] = await db.execute(
      'SELECT is_banned FROM users WHERE user_id = ?',
      [decoded.user_id]
    );
    if (row?.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    // ← use decoded.userId, since that's what we signed above
    req.user = {
      id:       decoded.user_id,
      username: decoded.username,    // added so we know who’s logged in
      is_admin: decoded.is_admin     // added admin flag for route guards
    };
    // console.log("\nauthenticate.js 15: \n", decoded)
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
