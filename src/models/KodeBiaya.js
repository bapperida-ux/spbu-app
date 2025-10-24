// src/models/KodeBiaya.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const KodeBiaya = sequelize.define('KodeBiaya', {
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
    type: DataTypes.ENUM('Penambah', 'Pengurang', 'Pindahan'), // Sesuai permintaan terakhir
    allowNull: false
  }
}, {
  tableName: 'kode_biayas', // Nama tabel di MySQL (biasanya jamak)
  timestamps: true
});

module.exports = KodeBiaya;