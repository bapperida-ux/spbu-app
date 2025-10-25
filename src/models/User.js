// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize; // Sesuaikan path jika perlu
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: "Username tidak boleh kosong" }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Password tidak boleh kosong" }
    }
  },
  nama_lengkap: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('admin', 'operator'),
    defaultValue: 'operator',
  },
}, {
  tableName: 'users', // Nama tabel di database
  timestamps: true,   // Otomatis tambah createdAt dan updatedAt
  hooks: {
    // Hash password sebelum user dibuat atau diupdate
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

// Method untuk membandingkan password saat login
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Sinkronisasi model dengan database (opsional, bisa dilakukan di server.js)
// sequelize.sync(); 

module.exports = User;