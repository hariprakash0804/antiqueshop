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

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting for auth endpoints
let authAttempts = {};
const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!authAttempts[ip]) authAttempts[ip] = [];
  // Remove entries older than 15 minutes
  authAttempts[ip] = authAttempts[ip].filter(t => now - t < 900000);
  if (authAttempts[ip].length >= 20) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  authAttempts[ip].push(now);
  next();
};

// Cleanup rate limiter memory every 30 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(authAttempts).forEach(ip => {
    authAttempts[ip] = authAttempts[ip].filter(t => now - t < 900000);
    if (authAttempts[ip].length === 0) delete authAttempts[ip];
  });
}, 1800000);

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
  res.json({ message: 'Futuristic Antique E-Commerce API is running...' });
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

    const connection = await mysql.createConnection(connectionOptions);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.end();
    console.log(`Database '${process.env.DB_NAME}' verified/created.`);

    // 2. Authenticate database connection via Sequelize
    await sequelize.authenticate();
    console.log('Sequelize connected successfully.');

    // 3. Sync DB models
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to database or start server:', error);
    process.exit(1);
  }
};

startServer();
