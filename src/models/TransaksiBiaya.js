// src/models/TransaksiBiaya.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TransaksiBiaya = sequelize.define('TransaksiBiaya', {
  kodeBiaya: {
    type: DataTypes.STRING,
    allowNull: false
    // Foreign Key opsional:
    // references: {
    //   model: 'kode_biayas',
    //   key: 'kode'
    // }
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'transaksi_biayas',
  timestamps: true
});

module.exports = TransaksiBiaya;