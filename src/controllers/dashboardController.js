// src/controllers/dashboardController.js
// Asumsi model Invoice dan Wallet sudah dibuat versi Sequelize
// Jika tidak, hapus atau sesuaikan kode ini
// const Invoice = require('../models/Invoice');
// const Wallet = require('../models/Wallet');

exports.getDashboardStats = async (req, res) => {
  try {
    // Ganti countDocuments dengan count
    // const totalInvoices = await Invoice.count();
    // const paidInvoices = await Invoice.count({ where: { status: 'Paid' } });
    // const unpaidInvoices = await Invoice.count({ where: { status: 'Unpaid' } });
    // const totalSent = await Invoice.count({ where: { status: 'Sent' } });

    // --- DATA DUMMY SEMENTARA ---
    // Ganti ini jika Anda sudah membuat model Invoice Sequelize
    const totalInvoices = 0;
    const paidInvoices = 0;
    const unpaidInvoices = 0;
    const totalSent = 0;
    // --- AKHIR DATA DUMMY ---


    res.json({ totalInvoices, paidInvoices, unpaidInvoices, totalSent });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getWalletBalance = async (req, res) => {
  try {
    // Ganti findOne dan create
    // let wallet = await Wallet.findOne();
    // if (!wallet) {
    //   wallet = await Wallet.create({ balance: 824571.93, lastChange: '+0.8% than last week' });
    // }

    // --- DATA DUMMY SEMENTARA ---
    // Ganti ini jika Anda sudah membuat model Wallet Sequelize
    const wallet = { balance: 824571.93, lastChange: '+0.8% than last week' };
    // --- AKHIR DATA DUMMY ---

    res.json(wallet);
  } catch (err) { res.status(500).json({ error: err.message }); }
};