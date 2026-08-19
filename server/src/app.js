const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const sequelize = require('./config/db');

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Disable X-Powered-By header to prevent technology disclosure
app.disable('x-powered-by');

// Security Headers Middleware (Session Hijack, XSS, Clickjacking, MIME-sniffing protection)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; connect-src 'self' https:;"
  );
  next();
});

// Configure CORS securely
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));

// Body parsers with payload bounds
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Resilient Rate Limiter against IP spoofing for auth endpoints
const authAttempts = new Map();
const rateLimiter = (req, res, next) => {
  // Use Express standard IP resolution without trusting unverified spoofed headers
  const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const attempts = (authAttempts.get(ip) || []).filter(t => now - t < 900000); // 15 mins window

  if (attempts.length >= 30) {
    return res.status(429).json({ 
      message: 'Excessive security verification attempts. Access temporarily throttled for 15 minutes.' 
    });
  }

  attempts.push(now);
  authAttempts.set(ip, attempts);
  next();
};

// Periodic cleanup of rate limiter memory every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of authAttempts.entries()) {
    const valid = timestamps.filter(t => now - t < 900000);
    if (valid.length === 0) {
      authAttempts.delete(ip);
    } else {
      authAttempts.set(ip, valid);
    }
  }
}, 900000);

// API Routes
app.use('/api/auth', rateLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Futuristic Antique E-Commerce API is running securely...' });
});

// Centralized sanitized error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal error occurred. Please contact system administrator.' 
      : (err.message || 'Server error')
  });
});

// Database Sync & Server Start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Proactively create database if it doesn't exist
    console.log('Verifying MySQL database existence...');
    const connectionOptions = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    };
    
    if (
      process.env.DB_SSL === 'true' || 
      (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com')) || 
      process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
    ) {
      connectionOptions.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
      };
    }

    try {
      const connection = await mysql.createConnection(connectionOptions);
      const safeDbName = (process.env.DB_NAME || 'antique_shop').replace(/`/g, '``');
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${safeDbName}\`;`);
      await connection.end();
      console.log(`Database '${safeDbName}' verified/created.`);
    } catch (dbError) {
      console.warn(`[DATABASE WARNING] Could not verify/create database automatically: ${dbError.message}. Relying on existing schema connection.`);
    }

    // 2. Authenticate database connection via Sequelize
    await sequelize.authenticate();
    console.log('Sequelize connected successfully.');

    // 3. Sync DB models
    await sequelize.sync();
    console.log('Database models synchronized.');
    app.listen(PORT, () => {
      console.log(`Server is running securely on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to database or start server:', error.message);
    process.exit(1);
  }
};

startServer();
