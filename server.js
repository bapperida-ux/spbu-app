// server.js

// ===== TAMBAHAN PENTING UNTUK TIMEZONE =====
// Set timezone Node.js secara global ke Waktu Indonesia Tengah (GMT+8)
// "Asia/Makassar" adalah ID resmi untuk WITA
process.env.TZ = 'Asia/Makassar'; 
// ===========================================

console.log('--- [Checkpoint 1] SCRIPT server.js DIMULAI ---');

try {
  require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const { sequelize, testConnection } = require('./src/config/db'); // Gunakan koneksi Sequelize

  console.log('--- [Checkpoint 2] Modul dasar berhasil di-load');

  // Impor Rute API (nama file tetap sama)
  const dashboardRoutes = require('./src/routes/dashboardRoutes');
  const kodeKasRoutes = require('./src/routes/kodeKasRoutes');
  const kodeBiayaRoutes = require('./src/routes/kodeBiayaRoutes');
  const transaksiKasRoutes = require('./src/routes/transaksiKasRoutes');
  const transaksiBiayaRoutes = require('./src/routes/transaksiBiayaRoutes');
  const laporanRoutes = require('./src/routes/laporanRoutes');
  const exportRoutes = require('./src/routes/exportRoutes');

  console.log('--- [Checkpoint 3] File Rute API berhasil di-load');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Gunakan Rute API
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/kodekas', kodeKasRoutes);
  app.use('/api/kodebiaya', kodeBiayaRoutes);
  app.use('/api/transaksikas', transaksiKasRoutes);
  app.use('/api/transaksibiaya', transaksiBiayaRoutes);
  app.use('/api/laporan', laporanRoutes);
  app.use('/api/export', exportRoutes);

  console.log('--- [Checkpoint 4] Express app berhasil dikonfigurasi');

  // Koneksi Database dan Jalankan Server
  console.log('--- [Checkpoint 5] Mencoba terhubung ke Database SQL...');

  // Pastikan koneksi DB berhasil SEBELUM server jalan
  testConnection().then(() => {
    
    // Sinkronisasi tabel sudah benar
    sequelize.sync({ force: false }).then(() => {
      console.log('✅ Sinkronisasi Database (Tabel) berhasil dibuat.');
      app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));
    }).catch(syncErr => console.error('❌ Gagal sinkronisasi DB:', syncErr));

  });

} catch (error) {
  console.error('\n❌❌❌ ERROR FATAL SAAT MEMULAI SERVER! ❌❌❌');
  console.error(error);
  process.exit(1); // Hentikan jika ada error fatal saat setup
}