const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Token blacklist Map: token -> expiryTimestampMs
const blacklistedTokens = new Map();

// Helper to add a token to the blacklist with automatic expiry tracking
const addToBlacklist = (token) => {
  try {
    const decoded = jwt.decode(token);
    // If token has exp claim, use it; otherwise fallback to 7 days
    const expiryMs = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
    blacklistedTokens.set(token, expiryMs);
  } catch (err) {
    blacklistedTokens.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
};

// Helper to check if token is blacklisted
const isBlacklisted = (token) => {
  if (!blacklistedTokens.has(token)) return false;
  const expiry = blacklistedTokens.get(token);
  if (Date.now() > expiry) {
    blacklistedTokens.delete(token);
    return false;
  }
  return true;
};

// Periodic cleanup of expired blacklisted tokens every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of blacklistedTokens.entries()) {
    if (now > expiry) {
      blacklistedTokens.delete(token);
    }
  }
}, 1800000);

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, empty token provided' });
      }

      if (isBlacklisted(token)) {
        return res.status(401).json({ message: 'Token has been invalidated by logout protocol.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcyberkey12345');
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid token structure' });
      }

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }

      // Check for token version invalidation (Session Hijacking & Revocation Protection)
      if (
        decoded.tokenVersion !== undefined && 
        req.user.tokenVersion !== undefined && 
        decoded.tokenVersion !== req.user.tokenVersion
      ) {
        return res.status(401).json({ message: 'Session invalidated due to credentials update. Please log in again.' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Not authorized, invalid token signature' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: `Access denied. Role: ${req.user ? req.user.role : 'none'} is unauthorized` });
    }
  };
};

module.exports = {
  protect,
  authorize,
  addToBlacklist,
  isBlacklisted,
  blacklistedTokens: {
    has: (token) => isBlacklisted(token),
    add: (token) => addToBlacklist(token)
  }
};
