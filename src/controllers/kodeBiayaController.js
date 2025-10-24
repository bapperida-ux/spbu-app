// src/controllers/kodeBiayaController.js
const KodeBiaya = require('../models/KodeBiaya'); // Impor model Sequelize
const { Op } = require('sequelize');

exports.createKodeBiaya = async (req, res) => {
  try {
    const { kode, uraian, jenis } = req.body;
    const newKodeBiaya = await KodeBiaya.create({ kode, uraian, jenis });
    res.status(201).json(newKodeBiaya);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Kode biaya sudah ada.' });
    }
    res.status(500).json({ error: err.message || 'Gagal menyimpan data' });
  }
};

exports.getAllKodeBiaya = async (req, res) => {
  try {
    const allKodeBiaya = await KodeBiaya.findAll({ order: [['kode', 'ASC']] });
    res.json(allKodeBiaya);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteKodeBiaya = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await KodeBiaya.destroy({ where: { id: id } });
    if (deletedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus', id: id });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getKodeBiayaById = async (req, res) => {
  try {
    const { id } = req.params;
    const kodeBiaya = await KodeBiaya.findByPk(id);
    if (!kodeBiaya) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(kodeBiaya);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateKodeBiaya = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, uraian, jenis } = req.body;

    const existing = await KodeBiaya.findOne({ where: { kode: kode, id: { [Op.ne]: id } } });
    if (existing) return res.status(400).json({ error: 'Kode biaya tersebut sudah dipakai data lain.' });

    const [updatedCount] = await KodeBiaya.update({ kode, uraian, jenis }, { where: { id: id } });
    if (updatedCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });

    const updatedKodeBiaya = await KodeBiaya.findByPk(id);
    res.json(updatedKodeBiaya);
  } catch (err) {
     if (err.name === 'SequelizeUniqueConstraintError') {
       return res.status(400).json({ error: 'Kode biaya tersebut sudah dipakai data lain.' });
     }
     res.status(500).json({ error: err.message });
  }
};