// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

// Impor fungsi controller
const { getDashboardStats, getWalletBalance } = require('../controllers/dashboardController');

// Tentukan endpoint:
// GET http://localhost:3000/api/dashboard/stats
router.get('/stats', getDashboardStats);

// GET http://localhost:3000/api/dashboard/wallet
router.get('/wallet', getWalletBalance);

module.exports = router;