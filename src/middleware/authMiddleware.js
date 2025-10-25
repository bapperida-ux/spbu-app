// src/middleware/authMiddleware.js
module.exports = {
  // Middleware untuk memastikan user sudah login
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) { // Fungsi dari Passport
      return next();
    }
    req.flash('error_msg', 'Silakan login terlebih dahulu.'); // Opsional: pesan flash
    res.redirect('/login');
  },

  // Middleware untuk memastikan user BELUM login (misal: halaman login/register)
  isGuest: (req, res, next) => {
     if (!req.isAuthenticated()) {
       return next();
     }
     res.redirect('/dashboard'); // Jika sudah login, redirect ke dashboard
   }
};