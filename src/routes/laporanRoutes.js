// src/routes/laporanRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getLaporanKas, 
  getLaporanBiaya,
  getLaporanMargin // <-- FUNGSI BARU
} = require('../controllers/laporanController');

// GET /api/laporan/kas?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/kas', getLaporanKas);

// GET /api/laporan/biaya?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/biaya', getLaporanBiaya);

// GET /api/laporan/margin?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD <-- RUTE BARU
router.get('/margin', getLaporanMargin);

module.exports = router;