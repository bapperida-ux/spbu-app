// src/models/KodeKas.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Pastikan path ini benar

const KodeKas = sequelize.define('KodeKas', {
  // ID (Primary Key) otomatis dibuat
  kode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  uraian: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jenis: {
    type: DataTypes.ENUM('Penambah', 'Pengurang', 'Pindahan'),
    allowNull: false
  }
}, {
  tableName: 'kode_kas', // Nama tabel di MySQL
  timestamps: true // Otomatis menambah createdAt dan updatedAt
});

module.exports = KodeKas;