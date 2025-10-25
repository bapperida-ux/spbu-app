// src/controllers/laporanHelper.js
const { Op } = require('sequelize');
const TransaksiKas = require('../models/TransaksiKas');
const TransaksiBiaya = require('../models/TransaksiBiaya');
const KodeKas = require('../models/KodeKas');
const KodeBiaya = require('../models/KodeBiaya');

// Helper untuk mendapatkan end of day (23:59:59)
function getEndOfDay(dateString) {
  const dateObj = new Date(dateString);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

// Fungsi getKodeMap (Tidak Berubah)
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

// Fungsi calculateSaldoAwalKas (Tidak Berubah)
async function calculateSaldoAwalKas(startDate) {
  let saldo = 0;
  const kodeKasMap = await getKodeMap(KodeKas);
  const kodeBiayaMap = await getKodeMap(KodeBiaya);
  try {
    const kasSebelum = await TransaksiKas.findAll({ where: { tanggal: { [Op.lt]: startDate } } });
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
    const biayaSebelum = await TransaksiBiaya.findAll({ where: { tanggal: { [Op.lt]: startDate } } });
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

// Fungsi calculateSaldoAwalBiaya (Tidak Berubah)
async function calculateSaldoAwalBiaya(startDate) {
  let saldoBiaya = 0;
  const kodeBiayaMap = await getKodeMap(KodeBiaya);
  try {
    const biayaSebelum = await TransaksiBiaya.findAll({ where: { tanggal: { [Op.lt]: startDate } } });
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

// Fungsi getLaporanKasData (Tidak Berubah, sudah benar dengan EOD)
async function getLaporanKasData(startDate, endDate) {
  try {
    const kodeKasMap = await getKodeMap(KodeKas);
    const saldoAwal = await calculateSaldoAwalKas(startDate);
    const endDateObj = getEndOfDay(endDate);
    const transactionsKas = await TransaksiKas.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } },
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

// Fungsi getLaporanBiayaData (Tidak Berubah, sudah benar dengan EOD)
async function getLaporanBiayaData(startDate, endDate) {
  try {
    const kodeBiayaMap = await getKodeMap(KodeBiaya);
    const saldoAwal = await calculateSaldoAwalBiaya(startDate);
    const endDateObj = getEndOfDay(endDate);
    const transactionsBiaya = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDateObj } },
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

    // ================== PERBAIKAN LOGIKA TANGGAL ==================
    // 1. Tentukan rentang tanggal untuk Biaya (Gaji, dll)
    const biayaEndDateObj = getEndOfDay(endDate);

    // 2. Tentukan rentang tanggal untuk Margin (H+1 s/d H-1)
    const marginStartDate = new Date(startDate);
    marginStartDate.setDate(marginStartDate.getDate() + 1); // H+1

    const marginEndDate = new Date(endDate);
    marginEndDate.setDate(marginEndDate.getDate() - 1); // H-1
    marginEndDate.setHours(23, 59, 59, 999); // Akhir hari H-1
    // ============================================================

    // Ambil Biaya sesuai rentang asli
    const transactionsBiayaAll = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: biayaEndDateObj } },
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    // Ambil Kas (Margin) sesuai rentang H+1 s/d H-1
    const transactionsKasAll = await TransaksiKas.findAll({
      where: {
        tanggal: { [Op.gte]: marginStartDate, [Op.lte]: marginEndDate }
      },
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const processedBiaya = transactionsBiayaAll.map(trxInstance => {
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      const jenis = detailKode ? detailKode.jenis : 'Lainnya';
      const totalAngka = parseFloat(trx.total) || 0;
      let uangMasuk = 0;
      let uangKeluar = 0;
      if (jenis === 'Penambah') {
        uangMasuk = totalAngka;
      } else {
        uangKeluar = totalAngka;
      }
      return {
        tanggal: trx.tanggal,
        kode: trx.kodeBiaya,
        uraian: detailKode ? detailKode.uraian : 'Kode Biaya Tdk Ditemukan',
        uangMasuk: uangMasuk,
        uangKeluar: uangKeluar,
        jenis: jenis,
        keterangan: trx.keterangan || '',
        isMargin: false
      };
    });

    // Filter KAS hanya untuk 'margin'
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

    // Urutkan gabungan data berdasarkan tanggal
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