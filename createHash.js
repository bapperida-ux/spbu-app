// createHash.js
const bcrypt = require('bcryptjs');

const passwordToHash = 'password_admin_anda'; // Ganti dengan password yang Anda inginkan

bcrypt.genSalt(10, (err, salt) => {
  if (err) throw err;
  bcrypt.hash(passwordToHash, salt, (err, hash) => {
    if (err) throw err;
    console.log('Password asli:', passwordToHash);
    console.log('Password HASH (simpan ini ke database):');
    console.log(hash); 
  });
});