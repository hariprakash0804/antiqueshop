const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RoleRequest = sequelize.define('RoleRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedRole: {
    type: DataTypes.ENUM('seller', 'order_manager'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = RoleRequest;
