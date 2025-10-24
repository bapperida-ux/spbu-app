// src/routes/transaksiKasRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createTransaksiKas, 
  getAllTransaksiKas,
  getTransaksiKasById,  // <-- BARU
  updateTransaksiKas,   // <-- BARU
  deleteTransaksiKas    // <-- BARU
} = require('../controllers/transaksiKasController');

// POST /api/transaksikas (Create)
router.post('/', createTransaksiKas);

// GET /api/transaksikas (Read All Today)
router.get('/', getAllTransaksiKas);

// GET /api/transaksikas/:id (Read One)
router.get('/:id', getTransaksiKasById);

// PUT /api/transaksikas/:id (Update One)
router.put('/:id', updateTransaksiKas);

// DELETE /api/transaksikas/:id (Delete One)
router.delete('/:id', deleteTransaksiKas);

module.exports = router;