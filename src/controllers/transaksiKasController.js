// src/controllers/transaksiKasController.js
const TransaksiKas = require('../models/TransaksiKas');
const { Op } = require('sequelize');

// Fungsi getTodayString() tidak kita perlukan lagi
// function getTodayString() { ... }

// ===== CREATE (Sudah Benar & Berhasil) =====
exports.createTransaksiKas = async (req, res) => {
  try {
    const { kodeKas, tanggal, total, keterangan } = req.body;

    const totalAngka = parseFloat(total); 
    if (isNaN(totalAngka)) {
      return res.status(400).json({ error: 'Total harus berupa angka yang valid.' });
    }

    const newTransaksi = await TransaksiKas.create({
      kodeKas,
      tanggal: tanggal,
      total: totalAngka,
      keterangan
    });
    res.status(201).json(newTransaksi);
  } catch (err) {
    console.error('❌ ERROR SAAT CREATE TRANSAKSI KAS:', err);
    res.status(500).json({ error: err.message }); 
  }
};

// ===== PERUBAHAN DI FUNGSI GET ALL =====
exports.getAllTransaksiKas = async (req, res) => {
  try {
    // KITA HAPUS SEMUA FILTER 'where'
    const allTransaksi = await TransaksiKas.findAll({
      order: [['createdAt', 'DESC']] // Kita hanya urutkan dari yg terbaru
    });
    res.json(allTransaksi);
  } catch (err) { 
    console.error('❌ ERROR SAAT GET ALL TRANSAKSI KAS:', err);
    res.status(500).json({ error: err.message }); 
  }
};
// ======================================

// --- Fungsi lainnya (Update, GetById, Delete) sudah benar ---

exports.updateTransaksiKas = async (req, res) => {
  try {
    const { id } = req.params;
    const { kodeKas, tanggal, total, keterangan } = req.body;
    
    const totalAngka = parseFloat(total);
    if (isNaN(totalAngka)) {
      return res.status(400).json({ error: 'Total harus berupa angka yang valid.' });
    }

    const [updatedCount] = await TransaksiKas.update(
      { kodeKas, tanggal: tanggal, total: totalAngka, keterangan },
      { where: { id: id } }
    );
    if (updatedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    const updated = await TransaksiKas.findByPk(id);
    res.json(updated);
  } catch (err) {
    console.error('❌ ERROR SAAT UPDATE TRANSAKSI KAS:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTransaksiKasById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaksi = await TransaksiKas.findByPk(id);
    if (!transaksi) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(transaksi);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTransaksiKas = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TransaksiKas.destroy({ where: { id: id } });
    if (deleted === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};