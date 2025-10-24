// src/config/db.js
const { Sequelize, Op } = require('sequelize');
require('dotenv').config(); 

// Buat instance Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,

    // ===== TAMBAHAN PENTING UNTUK TIMEZONE =====
    timezone: '+08:00' // Memberitahu Sequelize bahwa kita di GMT+8 (WITA)
    // ===========================================
  }
);

// Buat fungsi untuk mengetes koneksi
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi Sequelize (MySQL) berhasil.');
  } catch (error) {
    console.error('❌ Gagal koneksi Sequelize:', error.name);
    if (error.original) {
      console.error('   Detail Error:', error.original.message);
    }
    throw error;
  }
};

// Ekspor sequelize (untuk model) dan testConnection (untuk server.js)
module.exports = {
  sequelize,
  testConnection,
  Op
};