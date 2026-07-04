const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 100 }
  }
}, {
  timestamps: true
});

module.exports = Coupon;
