// src/routes/kodeBiayaRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createKodeBiaya, 
  getAllKodeBiaya, 
  deleteKodeBiaya,
  getKodeBiayaById, // <-- BARU
  updateKodeBiaya  // <-- BARU
} = require('../controllers/kodeBiayaController');

// POST /api/kodebiaya
router.post('/', createKodeBiaya);

// GET /api/kodebiaya
router.get('/', getAllKodeBiaya);

// GET /api/kodebiaya/:id (Ambil Satu) <-- BARU
router.get('/:id', getKodeBiayaById);

// PUT /api/kodebiaya/:id (Update Satu) <-- BARU
router.put('/:id', updateKodeBiaya);

// DELETE /api/kodebiaya/:id
router.delete('/:id', deleteKodeBiaya);

module.exports = router;