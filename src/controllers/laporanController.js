// src/controllers/laporanController.js
const { getLaporanKasData, getLaporanBiayaData, getLaporanMarginData } = require('./laporanHelper');

exports.getLaporanKas = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getLaporanKasData(startDate, endDate);
    res.json(result);
  } catch (err) {
    // ===== PERBAIKAN: TAMBAHKAN LOGGING =====
    console.error('❌ ERROR DI API LAPORAN KAS:', err);
    // =======================================
    res.status(500).json({ error: err.message }); 
  }
};

exports.getLaporanBiaya = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getLaporanBiayaData(startDate, endDate);
    res.json(result);
  } catch (err) {
    // ===== PERBAIKAN: TAMBAHKAN LOGGING =====
    console.error('❌ ERROR DI API LAPORAN BIAYA:', err);
    // =======================================
    res.status(500).json({ error: err.message }); 
  }
};

exports.getLaporanMargin = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await getLaporanMarginData(startDate, endDate);
    res.json(result);
  } catch (err) {
    console.error("❌ ERROR DI API LAPORAN MARGIN:", err);
    res.status(500).json({ error: err.message });
  }
};