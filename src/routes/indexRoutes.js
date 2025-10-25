// src/routes/indexRoutes.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

// Redirect dari root (/) ke dashboard jika sudah login, atau ke login jika belum
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// ================== PERUBAHAN DI SINI ==================
// Halaman Dashboard (GET) - Render layout utama
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('app_layout', { // <-- Menggunakan layout utama
    user: req.user, // Kirim data user ke layout
    currentPage: 'dashboard' // Opsional: Beri tahu layout halaman apa yang aktif
  });
});
// =======================================================

module.exports = router;