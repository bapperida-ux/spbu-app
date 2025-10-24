// src/routes/kodeKasRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createKodeKas, 
  getAllKodeKas, 
  deleteKodeKas,
  getKodeKasById,  // <-- BARU
  updateKodeKas   // <-- BARU
} = require('../controllers/kodeKasController');

// POST /api/kodekas (Buat)
router.post('/', createKodeKas);

// GET /api/kodekas (Ambil Semua)
router.get('/', getAllKodeKas);

// GET /api/kodekas/:id (Ambil Satu) <-- BARU
router.get('/:id', getKodeKasById);

// PUT /api/kodekas/:id (Update Satu) <-- BARU
router.put('/:id', updateKodeKas);

// DELETE /api/kodekas/:id (Hapus Satu)
router.delete('/:id', deleteKodeKas);

module.exports = router;