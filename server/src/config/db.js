const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialectOptions = {};
if (
  process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com')) || 
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== undefined
) {
  dialectOptions.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // set to console.log to see SQL queries
    dialectOptions,
    pool: {
      max: 50,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
