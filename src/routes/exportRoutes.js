// src/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const { 
  exportKasToExcel, 
  exportBiayaToExcel, 
  exportMarginToExcel 
} = require('../controllers/exportController');

// GET /api/export/kas?startDate=...&endDate=...
router.get('/kas', exportKasToExcel);

// GET /api/export/biaya?startDate=...&endDate=...
router.get('/biaya', exportBiayaToExcel);

// GET /api/export/margin?startDate=...&endDate=...
router.get('/margin', exportMarginToExcel);

module.exports = router;