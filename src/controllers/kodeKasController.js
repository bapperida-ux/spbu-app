// src/controllers/kodeKasController.js
const KodeKas = require('../models/KodeKas'); // Impor model Sequelize
const { Op } = require('sequelize'); // Impor Operator Sequelize

exports.createKodeKas = async (req, res) => {
  try {
    const { kode, uraian, jenis } = req.body;
    const newKodeKas = await KodeKas.create({ kode, uraian, jenis });
    res.status(201).json(newKodeKas);
  } catch (err) {
    // Tangani error unique constraint atau validasi lain
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Kode kas sudah ada.' });
    }
    res.status(500).json({ error: err.message || 'Gagal menyimpan data' });
  }
};

exports.getAllKodeKas = async (req, res) => {
  try {
    const allKodeKas = await KodeKas.findAll({ order: [['kode', 'ASC']] });
    res.json(allKodeKas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteKodeKas = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await KodeKas.destroy({ where: { id: id } });
    if (deletedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus', id: id });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getKodeKasById = async (req, res) => {
  try {
    const { id } = req.params;
    const kodeKas = await KodeKas.findByPk(id);
    if (!kodeKas) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(kodeKas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateKodeKas = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, uraian, jenis } = req.body;

    // Cek duplikasi kode (pakai Op.ne dari Sequelize)
    const existing = await KodeKas.findOne({ where: { kode: kode, id: { [Op.ne]: id } } });
    if (existing) return res.status(400).json({ error: 'Kode kas tersebut sudah dipakai data lain.' });

    const [updatedCount] = await KodeKas.update({ kode, uraian, jenis }, { where: { id: id } });
    if (updatedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });

    const updatedKodeKas = await KodeKas.findByPk(id);
    res.json(updatedKodeKas);
  } catch (err) {
     if (err.name === 'SequelizeUniqueConstraintError') {
       return res.status(400).json({ error: 'Kode kas tersebut sudah dipakai data lain.' });
     }
     res.status(500).json({ error: err.message });
  }
};