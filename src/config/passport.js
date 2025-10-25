// src/config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User'); // Sesuaikan path

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        // Cari user berdasarkan username
        const user = await User.findOne({ where: { username: username } });

        // Jika user tidak ditemukan
        if (!user) {
          return done(null, false, { message: 'Username tidak ditemukan.' });
        }

        // Cocokkan password
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          return done(null, user); // Sukses, kirim user
        } else {
          return done(null, false, { message: 'Password salah.' });
        }
      } catch (err) {
        return done(err); // Error server
      }
    })
  );

  // Serialisasi user ke session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialisasi user dari session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user); // Buat req.user tersedia
    } catch (err) {
      done(err);
    }
  });
};