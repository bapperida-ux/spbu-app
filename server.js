// server.js (LENGKAP dan DIPERBARUI)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { sequelize, testConnection } = require('./src/config/db');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Log Awal (Tetap)
console.log('--- [Checkpoint 1] SCRIPT server.js DIMULAI ---');
// Set Timezone (Tetap)
process.env.TZ = 'Asia/Makassar';

try {
  // Konfigurasi Passport (Panggil sebelum digunakan)
  require('./src/config/passport')(passport);
  console.log('--- [Checkpoint 2] Modul & Konfig Passport di-load');

  // Impor Rute
  // Rute Autentikasi & Halaman Utama (EJS)
  const authRoutes = require('./src/routes/authRoutes');
  const indexRoutes = require('./src/routes/indexRoutes');
  // Rute API Anda yang sudah ada
  const dashboardRoutes = require('./src/routes/dashboardRoutes');
  const kodeKasRoutes = require('./src/routes/kodeKasRoutes');
  const kodeBiayaRoutes = require('./src/routes/kodeBiayaRoutes');
  const transaksiKasRoutes = require('./src/routes/transaksiKasRoutes');
  const transaksiBiayaRoutes = require('./src/routes/transaksiBiayaRoutes');
  const laporanRoutes = require('./src/routes/laporanRoutes');
  const exportRoutes = require('./src/routes/exportRoutes');

  console.log('--- [Checkpoint 3] File Rute berhasil di-load');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware Umum
  app.use(cors()); // Aktifkan CORS jika frontend/API berbeda domain/port
  app.use(express.json()); // Body parser JSON
  app.use(express.urlencoded({ extended: true })); // Body parser Form

  // Set view engine ke EJS
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'src/views'));

  // Konfigurasi Session (SEBELUM Passport)
  const sessionStore = new SequelizeStore({ db: sequelize });
  app.use(
    session({
      secret: process.env.SESSION_SECRET, // WAJIB ADA di .env
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        // secure: process.env.NODE_ENV === 'production', // Aktifkan hanya di HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // Contoh: 1 hari
      }
    })
  );
  // Sinkronkan tabel session (opsional, bisa dilakukan bersama sync utama)
  // sessionStore.sync();

  // Middleware Passport (SETELAH Session)
  app.use(passport.initialize());
  app.use(passport.session());

  // Middleware Global untuk View (Opsional, agar 'user' tersedia di EJS)
  app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user || null;
    next();
  });

  // Middleware File Statis (CSS, JS Frontend, Gambar)
  // Diletakkan SETELAH middleware session/passport agar tidak bypass auth
  app.use(express.static(path.join(__dirname, 'public')));

  // Gunakan Rute
  app.use('/', indexRoutes);  // Harus duluan untuk '/' dan '/dashboard'
  app.use('/', authRoutes);   // Untuk '/login', '/logout'

  // Gunakan Rute API Anda (dengan prefix /api)
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
  testConnection().then(() => {
    sequelize.sync({ force: false }) // false agar tidak hapus data
      .then(() => {
        console.log('✅ Sinkronisasi Database (Tabel) berhasil.');
        app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));
      }).catch(syncErr => console.error('❌ Gagal sinkronisasi DB:', syncErr));
  }).catch(dbErr => {
      console.error('❌ Gagal koneksi ke DB saat startup:', dbErr);
      process.exit(1); // Hentikan server jika DB tidak connect
  });

} catch (error) {
  console.error('\n❌❌❌ ERROR FATAL SAAT MEMULAI SERVER! ❌❌❌');
  console.error(error);
  process.exit(1);
}