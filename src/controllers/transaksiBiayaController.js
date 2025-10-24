// src/controllers/transaksiBiayaController.js
const TransaksiBiaya = require('../models/TransaksiBiaya'); // Pastikan ini model Sequelize
const { Op } = require('sequelize');

// ===== CREATE (Membuat Data) =====
exports.createTransaksiBiaya = async (req, res) => {
  try {
    const { kodeBiaya, tanggal, total, keterangan } = req.body;

    // 1. Validasi Tipe Data: Ubah string "total" menjadi angka
    const totalAngka = parseFloat(total); 
    if (isNaN(totalAngka)) {
      return res.status(400).json({ error: 'Total harus berupa angka yang valid.' });
    }

    // 2. Logika Sequelize
    const newTransaksi = await TransaksiBiaya.create({
      kodeBiaya,
      tanggal: tanggal, // Simpan sebagai string "YYYY-MM-DD"
      total: totalAngka, // Simpan sebagai angka
      keterangan
    });
    res.status(201).json(newTransaksi);
  } catch (err) {
    // 3. Tampilkan error di terminal jika GAGAL simpan
    console.error('❌ ERROR SAAT CREATE TRANSAKSI BIAYA:', err);
    res.status(500).json({ error: err.message }); 
  }
};

// ===== GET ALL (Membaca Semua Data) =====
exports.getAllTransaksiBiaya = async (req, res) => {
  try {
    // Kita hapus filter 'where' untuk menampilkan SEMUA data
    const allTransaksi = await TransaksiBiaya.findAll({
      order: [['createdAt', 'DESC']] // Urutkan dari yg terbaru
    });
    res.json(allTransaksi);
  } catch (err) { 
    console.error('❌ ERROR SAAT GET ALL TRANSAKSI BIAYA:', err);
    res.status(500).json({ error: err.message }); 
  }
};

// ===== UPDATE (Mengubah Data) =====
exports.updateTransaksiBiaya = async (req, res) => {
  try {
    const { id } = req.params;
    const { kodeBiaya, tanggal, total, keterangan } = req.body;
    
    const totalAngka = parseFloat(total);
    if (isNaN(totalAngka)) {
      return res.status(400).json({ error: 'Total harus berupa angka yang valid.' });
    }

    // Logika Sequelize
    const [updatedCount] = await TransaksiBiaya.update(
      { 
        kodeBiaya, 
        tanggal: tanggal, 
        total: totalAngka, 
        keterangan 
      },
      { where: { id: id } }
    );
    if (updatedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    const updated = await TransaksiBiaya.findByPk(id);
    res.json(updated);
  } catch (err) {
    console.error('❌ ERROR SAAT UPDATE TRANSAKSI BIAYA:', err);
    res.status(500).json({ error: err.message });
  }
};

// --- Fungsi lainnya (Get by ID dan Delete) ---
exports.getTransaksiBiayaById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaksi = await TransaksiBiaya.findByPk(id); // Logika Sequelize
    if (!transaksi) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(transaksi);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTransaksiBiaya = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TransaksiBiaya.destroy({ where: { id: id } }); // Logika Sequelize
    if (deleted === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};