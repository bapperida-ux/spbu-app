// src/models/TransaksiKas.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TransaksiKas = sequelize.define('TransaksiKas', {
  kodeKas: {
    type: DataTypes.STRING,
    allowNull: false
    // Jika Anda ingin menghubungkan ke tabel kode_kas (Foreign Key):
    // references: {
    //   model: 'kode_kas', // Nama tabel
    //   key: 'kode'      // Kolom yang direferensikan
    // }
  },
  tanggal: {
    type: DataTypes.DATEONLY, // Hanya menyimpan tanggal (YYYY-MM-DD)
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2), // Menyimpan angka desimal (total digit, digit di belakang koma)
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT // Gunakan TEXT untuk teks yang lebih panjang
  }
}, {
  tableName: 'transaksi_kas',
  timestamps: true
});

module.exports = TransaksiKas;