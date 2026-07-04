const jwt = require('jsonwebtoken');
const { User } = require('../models');

const blacklistedTokens = new Set();

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (blacklistedTokens.has(token)) {
        return res.status(401).json({ message: 'Token has been invalidated by logout protocol.' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcyberkey12345');
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
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
  blacklistedTokens
};
