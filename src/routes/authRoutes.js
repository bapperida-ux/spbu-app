// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/authMiddleware');

// Halaman Login (GET) - Hanya bisa diakses jika BELUM login
router.get('/login', isGuest, authController.showLoginPage);

// Proses Login (POST)
router.post('/login', isGuest, (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard', // Redirect ke dashboard jika sukses
    failureRedirect: '/login?error=true', // Redirect kembali ke login jika gagal + query error
    failureFlash: false // Atur ke true jika pakai connect-flash
  })(req, res, next);
});


// Proses Logout (GET) - Hanya bisa diakses jika SUDAH login
router.get('/logout', isAuthenticated, authController.logoutUser);

// (Opsional) Rute Register
// router.get('/register', isGuest, authController.showRegisterPage);
// router.post('/register', isGuest, authController.registerUser);

module.exports = router;