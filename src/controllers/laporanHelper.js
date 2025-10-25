// src/controllers/laporanHelper.js
const { Op } = require('sequelize');
const TransaksiKas = require('../models/TransaksiKas');
const TransaksiBiaya = require('../models/TransaksiBiaya');
const KodeKas = require('../models/KodeKas');
const KodeBiaya = require('../models/KodeBiaya');

// Fungsi getKodeMap (Sudah Benar)
async function getKodeMap(model) {
  try {
    const items = await model.findAll();
    const map = new Map();
    items.forEach(item => map.set(item.kode, item.toJSON()));
    return map;
  } catch (error) {
    console.error(`Error fetching kode map for ${model.name}:`, error);
    throw new Error(`Gagal memuat data master ${model.name}`);
  }
}

// Fungsi calculateSaldoAwalKas (Sudah Benar)
async function calculateSaldoAwalKas(startDate) {
  let saldo = 0;
  const kodeKasMap = await getKodeMap(KodeKas);
  const kodeBiayaMap = await getKodeMap(KodeBiaya);

  try {
    const kasSebelum = await TransaksiKas.findAll({
      where: { tanggal: { [Op.lt]: startDate } }
    });
    kasSebelum.forEach(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeKasMap.get(trx.kodeKas);
      if (detailKode) {
        const total = parseFloat(trx.total);
        if (!isNaN(total)) {
          if (detailKode.jenis === 'Penambah') saldo += total;
          else if (detailKode.jenis === 'Pengurang') saldo -= total;
        }
      }
    });

    const biayaSebelum = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.lt]: startDate } }
    });
    biayaSebelum.forEach(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      if (detailKode) {
        const total = parseFloat(trx.total);
        if (!isNaN(total)) {
          if (detailKode.jenis === 'Pengurang' || detailKode.jenis === 'Pindahan') saldo -= total;
          else if (detailKode.jenis === 'Penambah') saldo += total;
        }
      }
    });
    return saldo;
  } catch (error) {
     console.error("Error calculating saldo awal kas:", error);
     throw new Error("Gagal menghitung saldo awal kas.");
  }
}

// Fungsi calculateSaldoAwalBiaya (Sudah Benar)
async function calculateSaldoAwalBiaya(startDate) {
  let saldoBiaya = 0;
  const kodeBiayaMap = await getKodeMap(KodeBiaya);

  try {
    const biayaSebelum = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.lt]: startDate } }
    });
    biayaSebelum.forEach(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      if (detailKode) {
        const total = parseFloat(trx.total);
        if (!isNaN(total)) {
          if (detailKode.jenis === 'Pengurang' || detailKode.jenis === 'Pindahan') saldoBiaya -= total;
          else if (detailKode.jenis === 'Penambah') saldoBiaya += total;
        }
      }
    });
    return saldoBiaya;
  } catch (error) {
      console.error("Error calculating saldo awal biaya:", error);
      throw new Error("Gagal menghitung saldo awal biaya.");
  }
}

// Fungsi getLaporanKasData (DIPERBAIKI)
async function getLaporanKasData(startDate, endDate) {
  try {
    const kodeKasMap = await getKodeMap(KodeKas);
    const saldoAwal = await calculateSaldoAwalKas(startDate);

    // ================== PERBAIKAN TIMEZONE ==================
    // Set endDate ke akhir hari (23:59:59)
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    // ========================================================

    const transactionsKas = await TransaksiKas.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } }, // Gunakan endDateObj
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const processedKas = transactionsKas.map(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeKasMap.get(trx.kodeKas);
      const jenis = detailKode ? detailKode.jenis : 'Lainnya';
      return {
        tanggal: trx.tanggal,
        kode: trx.kodeKas,
        uraian: detailKode ? detailKode.uraian : 'Kode Kas Tdk Ditemukan',
        jenis: jenis,
        total: parseFloat(trx.total) || 0,
        keterangan: trx.keterangan || ''
      };
    });

    return { saldoAwal, transaksi: processedKas };
  } catch (error) {
      console.error("Error generating laporan kas:", error);
      throw new Error("Gagal membuat data laporan kas.");
  }
}

// Fungsi getLaporanBiayaData (DIPERBAIKI)
async function getLaporanBiayaData(startDate, endDate) {
  try {
    const kodeBiayaMap = await getKodeMap(KodeBiaya);
    const saldoAwal = await calculateSaldoAwalBiaya(startDate);

    // ================== PERBAIKAN TIMEZONE ==================
    // Set endDate ke akhir hari (23:59:59)
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    // ========================================================

    const transactionsBiaya = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } }, // Gunakan endDateObj
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const processedBiaya = transactionsBiaya.map(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      const jenis = detailKode ? detailKode.jenis : 'Lainnya';
      return {
        tanggal: trx.tanggal,
        kode: trx.kodeBiaya,
        uraian: detailKode ? detailKode.uraian : 'Kode Biaya Tdk Ditemukan',
        jenis: jenis,
        total: parseFloat(trx.total) || 0,
        keterangan: trx.keterangan || ''
      };
    });

    return { saldoAwal, transaksi: processedBiaya };
  } catch (error) {
    console.error("Error generating laporan biaya:", error);
    throw new Error("Gagal membuat data laporan biaya.");
  }
}


// ===== FUNGSI GETLAPORANMARGINDATA (DIPERBAIKI) =====
async function getLaporanMarginData(startDate, endDate) {
  try {
    const kodeKasMap = await getKodeMap(KodeKas);
    const kodeBiayaMap = await getKodeMap(KodeBiaya);
    const saldoAwal = await calculateSaldoAwalKas(startDate);

    // ================== PERBAIKAN TIMEZONE ==================
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    // ========================================================

    const transactionsKasAll = await TransaksiKas.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } }, // Gunakan endDateObj
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const transactionsBiayaAll = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } }, // Gunakan endDateObj
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const processedBiaya = transactionsBiayaAll.map(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      const jenis = detailKode ? detailKode.jenis : 'Lainnya';
      const totalAngka = parseFloat(trx.total) || 0;
      
      // ================== PERBAIKAN BUG LOGIKA ==================
      // Membedakan uangMasuk dan uangKeluar berdasarkan jenis
      let uangMasuk = 0;
      let uangKeluar = 0;
      if (jenis === 'Penambah') {
        uangMasuk = totalAngka;
      } else {
        uangKeluar = totalAngka;
      }
      // ==========================================================

      return {
        tanggal: trx.tanggal,
        kode: trx.kodeBiaya,
        uraian: detailKode ? detailKode.uraian : 'Kode Biaya Tdk Ditemukan',
        uangMasuk: uangMasuk, // <-- Diperbaiki
        uangKeluar: uangKeluar, // <-- Diperbaiki
        jenis: jenis,
        keterangan: trx.keterangan || '',
        isMargin: false
      };
    });

    const processedMargin = transactionsKasAll
      .filter(txInstance => {
        const tx = txInstance.toJSON();
        const detailKode = kodeKasMap.get(tx.kodeKas);
        const uraianLower = detailKode ? String(detailKode.uraian).trim().toLowerCase() : "";
        return uraianLower === 'margin';
      })
      .map(txInstance => {
        const tx = txInstance.toJSON();
        const totalAngka = parseFloat(tx.total) || 0;
        return {
          tanggal: tx.tanggal,
          kode: tx.kodeKas,
          uraian: 'Margin Harian',
          uangMasuk: totalAngka,
          uangKeluar: 0,
          jenis: 'Penambah',
          keterangan: tx.keterangan || '',
          isMargin: true
        };
      });

    const combinedData = [...processedBiaya, ...processedMargin];

    combinedData.sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      if (!a.isMargin && b.isMargin) return -1;
      if (a.isMargin && !b.isMargin) return 1;
      return 0;
    });

    return {
      saldoAwal: saldoAwal,
      transaksi: combinedData
    };
  } catch (error) {
    console.error("Error generating laporan margin:", error);
    throw new Error("Gagal membuat data laporan margin.");
  }
}
// =================================================

module.exports = {
  getLaporanKasData,
  getLaporanBiayaData,
  getLaporanMarginData
};