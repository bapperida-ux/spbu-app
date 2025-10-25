// src/controllers/authController.js

// Menampilkan halaman login
exports.showLoginPage = (req, res) => {
  // Ambil pesan flash jika ada
  // const errorMsg = req.flash('error'); // Perlu connect-flash
  // const successMsg = req.flash('success_msg'); // Perlu connect-flash
  res.render('login', {
     layout: false, // Jika pakai layout EJS terpisah
     // error: errorMsg.length > 0 ? errorMsg[0] : null, // Kirim error ke template
     // success_msg: successMsg.length > 0 ? successMsg[0] : null // Kirim pesan sukses
     error: req.query.error // Alternatif tanpa flash: ambil dari query parameter
  });
};

// Menangani proses logout
exports.logoutUser = (req, res, next) => {
  req.logout(function(err) { // req.logout butuh callback
    if (err) { return next(err); }
    // req.flash('success_msg', 'Anda berhasil logout.'); // Opsional
    res.redirect('/login');
  });
};

// (Opsional) Menampilkan halaman register
// exports.showRegisterPage = (req, res) => { ... };

// (Opsional) Menangani proses register
// exports.registerUser = async (req, res) => { ... };