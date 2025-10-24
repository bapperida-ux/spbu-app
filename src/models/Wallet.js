// src/models/Wallet.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Wallet = sequelize.define('Wallet', {
  balance: {
    type: DataTypes.DECIMAL(15, 2), // Gunakan DECIMAL
    defaultValue: 0.00
  },
  lastChange: {
    type: DataTypes.STRING,
    defaultValue: '+0.0% than last week'
  }
  // Tidak perlu timestamps jika tidak relevan
}, {
   tableName: 'wallets',
   timestamps: false // Mungkin tidak perlu createdAt/updatedAt untuk ini?
});

module.exports = Wallet;