// src/models/Invoice.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  clientName: {
     type: DataTypes.STRING
     // allowNull: false // Mungkin perlu?
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2) // Gunakan DECIMAL untuk uang
    // allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Unpaid', 'Sent'),
    defaultValue: 'Sent' // Default value
    // allowNull: false
  }
}, {
  tableName: 'invoices',
  timestamps: true
});

module.exports = Invoice;