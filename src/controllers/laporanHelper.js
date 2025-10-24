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

// Fungsi getLaporanKasData (Sudah Benar)
async function getLaporanKasData(startDate, endDate) {
  try {
    const kodeKasMap = await getKodeMap(KodeKas);
    const saldoAwal = await calculateSaldoAwalKas(startDate);

    const transactionsKas = await TransaksiKas.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDate } },
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
      // Melempar error lagi agar ditangkap controller
      throw new Error("Gagal membuat data laporan kas.");
  }
}

// Fungsi getLaporanBiayaData (Sudah Benar)
async function getLaporanBiayaData(startDate, endDate) {
  try {
    const kodeBiayaMap = await getKodeMap(KodeBiaya);
    const saldoAwal = await calculateSaldoAwalBiaya(startDate); // Menggunakan saldo biaya

    const transactionsBiaya = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDate } },
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
  try { // Tambahkan try...catch utama
    const kodeKasMap = await getKodeMap(KodeKas);
    const kodeBiayaMap = await getKodeMap(KodeBiaya);
    const saldoAwal = await calculateSaldoAwalKas(startDate); // Laporan Margin pakai Saldo Kas Awal

    const transactionsKasAll = await TransaksiKas.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDate } },
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const transactionsBiayaAll = await TransaksiBiaya.findAll({
      where: { tanggal: { [Op.gte]: startDate, [Op.lte]: endDate } },
      order: [['tanggal', 'ASC'], ['createdAt', 'ASC']]
    });

    const processedBiaya = transactionsBiayaAll.map(trxInstance => {
      // PERBAIKAN: Gunakan .toJSON() di sini
      const trx = trxInstance.toJSON();
      const detailKode = kodeBiayaMap.get(trx.kodeBiaya);
      const jenis = detailKode ? detailKode.jenis : 'Lainnya';
      // PERBAIKAN: Pastikan parseFloat() dipanggil
      const totalAngka = parseFloat(trx.total) || 0;
      return {
        tanggal: trx.tanggal,
        kode: trx.kodeBiaya,
        uraian: detailKode ? detailKode.uraian : 'Kode Biaya Tdk Ditemukan',
        uangMasuk: 0,
        uangKeluar: totalAngka, // Gunakan angka
        jenis: jenis, // Sertakan jenis
        keterangan: trx.keterangan || '',
        isMargin: false
      };
    });

    const processedMargin = transactionsKasAll
      .filter(txInstance => {
        // PERBAIKAN: Gunakan .toJSON() di sini
        const tx = txInstance.toJSON();
        const detailKode = kodeKasMap.get(tx.kodeKas);
        // Pastikan detailKode ada sebelum akses uraian
        const uraianLower = detailKode ? String(detailKode.uraian).trim().toLowerCase() : "";
        return uraianLower === 'margin';
      })
      .map(txInstance => {
        // PERBAIKAN: Gunakan .toJSON() di sini
        const tx = txInstance.toJSON();
        // PERBAIKAN: Pastikan parseFloat() dipanggil
        const totalAngka = parseFloat(tx.total) || 0;
        return {
          tanggal: tx.tanggal,
          kode: tx.kodeKas,
          uraian: 'Margin Harian',
          uangMasuk: totalAngka, // Gunakan angka
          uangKeluar: 0,
          jenis: 'Penambah', // Margin selalu penambah
          keterangan: tx.keterangan || '',
          isMargin: true
        };
      });

    const combinedData = [...processedBiaya, ...processedMargin];

    // Perbaiki sort agar stabil jika tanggal sama
    combinedData.sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      // Jika tanggal sama, mungkin perlu sort berdasarkan createdAt jika model punya
      // atau berdasarkan isMargin (biaya dulu baru margin?)
      if (!a.isMargin && b.isMargin) return -1; // Biaya sebelum margin
      if (a.isMargin && !b.isMargin) return 1;  // Margin setelah biaya
      return 0; // Urutan asli jika sama
    });

    return {
      saldoAwal: saldoAwal,
      transaksi: combinedData
    };
  } catch (error) {
    console.error("Error generating laporan margin:", error);
    throw new Error("Gagal membuat data laporan margin."); // Lempar error
  }
}
// =================================================

module.exports = {
  getLaporanKasData,
  getLaporanBiayaData,
  getLaporanMarginData
};