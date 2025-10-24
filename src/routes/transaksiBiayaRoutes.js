// src/routes/transaksiBiayaRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createTransaksiBiaya, 
  getAllTransaksiBiaya,
  getTransaksiBiayaById,  // <-- BARU
  updateTransaksiBiaya,   // <-- BARU
  deleteTransaksiBiaya    // <-- BARU
} = require('../controllers/transaksiBiayaController');

// POST /api/transaksibiaya (Create)
router.post('/', createTransaksiBiaya);

// GET /api/transaksibiaya (Read All Today)
router.get('/', getAllTransaksiBiaya);

// GET /api/transaksibiaya/:id (Read One)
router.get('/:id', getTransaksiBiayaById);

// PUT /api/transaksibiaya/:id (Update One)
router.put('/:id', updateTransaksiBiaya);

// DELETE /api/transaksibiaya/:id (Delete One)
router.delete('/:id', deleteTransaksiBiaya);

module.exports = router;