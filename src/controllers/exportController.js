// src/controllers/exportController.js
const ExcelJS = require('exceljs');
const { getLaporanKasData, getLaporanBiayaData, getLaporanMarginData } = require('./laporanHelper'); // Pastikan path ini benar

// --- Helper Styling ---
const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};
const totalStyle = {
  font: { bold: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } },
  alignment: { horizontal: 'right' },
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};
const dataCellStyle = {
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  alignment: { vertical: 'top', wrapText: true }
};
const dateCellStyle = {
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
  numFmt: 'dd/mm/yyyy'
};
const numberCellStyle = {
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true }
};
const centerCellStyle = {
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'center', wrapText: true }
};

// ================== PERBAIKAN FORMAT ANGKA ==================
// Format Angka Universal:
// Positif: "Rp 1.234" (Warna default)
// Negatif: "-Rp 1.234" (Warna Merah)
const rupiahFormat = '"Rp"#,##0;[Red]"-Rp"#,##0';

// Style untuk Sisa Saldo (Warna otomatis: Hitam jika positif, Merah jika negatif)
const rupiahSaldoStyle = {
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'right', wrapText: true },
    numFmt: rupiahFormat
};

// Style untuk Uang Masuk (Selalu HIJAU)
const rupiahMasukStyle = {
    ...rupiahSaldoStyle, // Warisi format dan border
    font: { color: { argb: 'FF008000' } } // Paksa warna HIJAU
};

// Style untuk Uang Keluar (Selalu MERAH)
const rupiahKeluarStyle = {
    ...rupiahSaldoStyle, // Warisi format dan border
    font: { color: { argb: 'FFFF0000' } } // Paksa warna MERAH
};
// =======================================================


// Helper untuk kalkulasi lebar
function simpleFormatRupiahForLength(number) {
    if (isNaN(Number(number))) return '';
    const num = Number(number);
    const prefix = num < 0 ? '-Rp ' : 'Rp ';
    return `${prefix}${Math.abs(num).toLocaleString('id-ID')}`;
}


// --- Fungsi Ekspor Kas ---
exports.exportKasToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).send('Parameter startDate dan endDate diperlukan.');

    const { saldoAwal, transaksi } = await getLaporanKasData(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aplikasi SPBU'; workbook.lastModifiedBy = 'Aplikasi SPBU'; workbook.created = new Date(); workbook.modified = new Date();
    const worksheet = workbook.addWorksheet('Laporan Kas');

    // Judul & Tanggal
    worksheet.mergeCells('A1:G1'); worksheet.getCell('A1').value = 'Laporan Kas SPBU Kolongan'; worksheet.getCell('A1').font = { size: 16, bold: true }; worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.addRow([]);
    worksheet.mergeCells('A3:G3'); worksheet.getCell('A3').value = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`; worksheet.getCell('A3').font = { italic: true }; worksheet.getCell('A3').alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    // Header Tabel
    const headerRow = worksheet.addRow(['Tanggal', 'Kode', 'Uraian', 'Uang Masuk', 'Uang Keluar', 'Sisa Saldo', 'Keterangan']);
    headerRow.eachCell((cell) => cell.style = headerStyle); headerRow.height = 30;

    // Persiapan Auto Width
    const columnWidths = [15, 15, 40, 20, 20, 25, 30];
    const updateColumnWidth = (colIndex, textLength) => {
        if (colIndex === 0) { columnWidths[0] = Math.max(columnWidths[0], 15); return; }
        const currentLength = textLength + 2; if (currentLength > columnWidths[colIndex]) columnWidths[colIndex] = currentLength;
    };

    // Baris Saldo Awal
    const saldoAwalNum = parseFloat(saldoAwal) || 0;
    let startDateObj = new Date(startDate); if (isNaN(startDateObj.getTime())) { startDateObj = startDate; }
    const saldoAwalData = [ startDateObj, '', 'SALDO AWAL', '', '', saldoAwalNum, '' ];
    const saldoAwalRow = worksheet.addRow(saldoAwalData);
    worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
    saldoAwalRow.getCell('A').style = dateCellStyle;
    updateColumnWidth(2, 'SALDO AWAL'.length);
    saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
    // Gunakan style saldo (otomatis hitam/merah)
    saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahSaldoStyle }; 
    saldoAwalRow.getCell('B').style = dataCellStyle; saldoAwalRow.getCell('D').style = dataCellStyle; saldoAwalRow.getCell('E').style = dataCellStyle; saldoAwalRow.getCell('G').style = dataCellStyle;
    updateColumnWidth(5, simpleFormatRupiahForLength(saldoAwalNum).length);

    // Loop Data Transaksi
    let currentSaldo = saldoAwalNum; let totalMasukPeriode = 0; let totalKeluarPeriode = 0;
    transaksi.forEach(trx => {
      let uangMasuk = 0; let uangKeluar = 0;
      const totalAngka = parseFloat(trx.total) || 0;
      if (trx.jenis === 'Penambah') { uangMasuk = totalAngka; currentSaldo += totalAngka; totalMasukPeriode += totalAngka; }
      else { uangKeluar = totalAngka; currentSaldo -= totalAngka; totalKeluarPeriode += totalAngka; }

      let tanggalValue = '-';
      try { tanggalValue = new Date(trx.tanggal); if (isNaN(tanggalValue.getTime())) { tanggalValue = trx.tanggal; } }
      catch(e){ tanggalValue = trx.tanggal; }

      // ================== PERBAIKAN DATA ROW ==================
      // Uang Keluar dimasukkan sebagai angka NEGATIF
      const rowData = [ tanggalValue, trx.kode || '', trx.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? -uangKeluar : '', currentSaldo, trx.keterangan || '' ];
      // ========================================================
      const dataRow = worksheet.addRow(rowData);

      // Apply styling & Hitung Lebar Kolom
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
         const colIndex = colNumber - 1;
         let cellTextLength = 0;
         let isDate = false;

         if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
             if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){
                 cell.style = dateCellStyle;
                 cellTextLength = 10;
                 isDate = true;
             } else if (typeof cell.value === 'number') {
                 // ================== PERBAIKAN STYLE WARNA ==================
                 if (colNumber === 4) { // Kolom Uang Masuk
                     cell.style = rupiahMasukStyle; // HIJAU
                 } else if (colNumber === 5) { // Kolom Uang Keluar
                     cell.style = rupiahKeluarStyle; // MERAH
                 } else if (colNumber === 6) { // Kolom Sisa Saldo
                     cell.style = rupiahSaldoStyle; // Standar (Otomatis)
                 } else {
                     cell.style = numberCellStyle;
                 }
                 cellTextLength = simpleFormatRupiahForLength(cell.value).length;
                 // ==========================================================
             } else { // String
                 cellTextLength = cell.value.toString().length;
                 if (colNumber === 1) cell.style = dataCellStyle;
                 else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle;
                 else if (colNumber === 2) cell.style = centerCellStyle;
                 else cell.style = dataCellStyle;
             }
             if (!isDate) {
                updateColumnWidth(colIndex, cellTextLength);
             }
         } else {
             cell.style = dataCellStyle;
         }
      });
    });

    // Baris Total Periode
    worksheet.addRow([]);
    // ================== PERBAIKAN DATA ROW ==================
    // Total Keluar dimasukkan sebagai angka NEGATIF
    const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, -totalKeluarPeriode, '', '']);
    // ========================================================
    worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
    totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
    totalRow.getCell('C').value = 'TOTAL PERIODE';
    totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
    
    // ================== PERBAIKAN STYLE WARNA ==================
    totalRow.getCell('D').style = { ...totalStyle, ...rupiahMasukStyle }; // HIJAU
    totalRow.getCell('E').style = { ...totalStyle, ...rupiahKeluarStyle }; // MERAH
    // ===========================================================

    totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
    updateColumnWidth(3, simpleFormatRupiahForLength(totalMasukPeriode).length);
    updateColumnWidth(4, simpleFormatRupiahForLength(-totalKeluarPeriode).length);

    // Terapkan Auto Width
    columnWidths.forEach((width, index) => {
        const finalWidth = Math.min(width, 60); worksheet.getColumn(index + 1).width = finalWidth;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Laporan_Kas_${startDate}_${endDate}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting Kas to Excel:', error);
    res.status(500).send(`Gagal mengekspor laporan Kas: ${error.message}`);
  }
};

// --- Fungsi Ekspor Biaya (SUDAH DIPERBAIKI) ---
exports.exportBiayaToExcel = async (req, res) => {
   try {
     const { startDate, endDate } = req.query;
     if (!startDate || !endDate) return res.status(400).send('Parameter startDate dan endDate diperlukan.');
     const { saldoAwal, transaksi } = await getLaporanBiayaData(startDate, endDate);
     const workbook = new ExcelJS.Workbook();
     workbook.creator = 'Aplikasi SPBU'; workbook.lastModifiedBy = 'Aplikasi SPBU'; workbook.created = new Date(); workbook.modified = new Date();
     const worksheet = workbook.addWorksheet('Laporan Biaya');
     
     worksheet.mergeCells('A1:G1'); worksheet.getCell('A1').value = 'Laporan Biaya SPBU Kolongan'; worksheet.getCell('A1').font = { size: 16, bold: true }; worksheet.getCell('A1').alignment = { horizontal: 'center' };
     worksheet.addRow([]);
     worksheet.mergeCells('A3:G3'); worksheet.getCell('A3').value = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`; worksheet.getCell('A3').font = { italic: true }; worksheet.getCell('A3').alignment = { horizontal: 'center' };
     worksheet.addRow([]);
     const headerRow = worksheet.addRow(['Tanggal', 'Kode', 'Uraian', 'Uang Masuk', 'Uang Keluar', 'Sisa Saldo', 'Keterangan']);
     headerRow.eachCell((cell) => cell.style = headerStyle); headerRow.height = 30;
     
     const columnWidthsBiaya = [15, 15, 40, 20, 20, 25, 30];
     const updateColWidthBiaya = (colIndex, textLength) => { if (colIndex === 0) { columnWidthsBiaya[0] = Math.max(columnWidthsBiaya[0], 15); return; } const currentLength = textLength + 2; if (currentLength > columnWidthsBiaya[colIndex]) columnWidthsBiaya[colIndex] = currentLength; };
     
     const saldoAwalNum = parseFloat(saldoAwal) || 0;
     let startDateObjBiaya = new Date(startDate); if (isNaN(startDateObjBiaya.getTime())) { startDateObjBiaya = startDate; }
     const saldoAwalData = [ startDateObjBiaya, '', 'SALDO AWAL', '', '', saldoAwalNum, '' ];
     const saldoAwalRow = worksheet.addRow(saldoAwalData);
     worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
     saldoAwalRow.getCell('A').style = dateCellStyle;
     updateColWidthBiaya(2, 'SALDO AWAL'.length);
     saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
     saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahSaldoStyle };
     saldoAwalRow.getCell('B').style = dataCellStyle; saldoAwalRow.getCell('D').style = dataCellStyle; saldoAwalRow.getCell('E').style = dataCellStyle; saldoAwalRow.getCell('G').style = dataCellStyle;
     updateColWidthBiaya(5, simpleFormatRupiahForLength(saldoAwalNum).length);
     
     let currentSaldo = saldoAwalNum; let totalMasukPeriode = 0; let totalKeluarPeriode = 0;
     transaksi.forEach(trx => {
         let uangMasuk = 0; let uangKeluar = 0;
         const totalAngka = parseFloat(trx.total) || 0;
         if (trx.jenis === 'Penambah') { uangMasuk = totalAngka; currentSaldo += totalAngka; totalMasukPeriode += totalAngka; }
         else { uangKeluar = totalAngka; currentSaldo -= totalAngka; totalKeluarPeriode += totalAngka; }
         let tanggalValue = '-'; try { tanggalValue = new Date(trx.tanggal); if (isNaN(tanggalValue.getTime())) tanggalValue = trx.tanggal; } catch(e){ tanggalValue = trx.tanggal; }
         
         // Uang Keluar dimasukkan sebagai angka NEGATIF
         const rowData = [ tanggalValue, trx.kode || '', trx.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? -uangKeluar : '', currentSaldo, trx.keterangan || '' ];
         const dataRow = worksheet.addRow(rowData);
         
         dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
             const colIndex = colNumber - 1; let cellTextLength = 0; let isDate = false;
             if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                 if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){ cell.style = dateCellStyle; cellTextLength = 10; isDate = true; }
                 else if (typeof cell.value === 'number') { 
                     if (colNumber === 4) { cell.style = rupiahMasukStyle; } // HIJAU
                     else if (colNumber === 5) { cell.style = rupiahKeluarStyle; } // MERAH
                     else if (colNumber === 6) { cell.style = rupiahSaldoStyle; } // Standar
                     else { cell.style = numberCellStyle; }
                     cellTextLength = simpleFormatRupiahForLength(cell.value).length; 
                 }
                 else { cellTextLength = cell.value.toString().length; if (colNumber === 1) cell.style = dataCellStyle; else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle; else if (colNumber === 2) cell.style = centerCellStyle; else cell.style = dataCellStyle; }
                 if(!isDate) updateColWidthBiaya(colIndex, cellTextLength);
             } else { cell.style = dataCellStyle; }
         });
     });
     
     worksheet.addRow([]);
     // Total Keluar dimasukkan sebagai angka NEGATIF
     const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, -totalKeluarPeriode, '', '']);
     worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
     totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
     totalRow.getCell('C').value = 'TOTAL PERIODE';
     totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
     
     totalRow.getCell('D').style = { ...totalStyle, ...rupiahMasukStyle }; // HIJAU
     totalRow.getCell('E').style = { ...totalStyle, ...rupiahKeluarStyle }; // MERAH
     
     totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
     updateColWidthBiaya(3, simpleFormatRupiahForLength(totalMasukPeriode).length); updateColWidthBiaya(4, simpleFormatRupiahForLength(-totalKeluarPeriode).length);
     
     columnWidthsBiaya.forEach((width, index) => { const finalWidth = Math.min(width, 60); worksheet.getColumn(index + 1).width = finalWidth; });
     
     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
     res.setHeader('Content-Disposition', `attachment; filename="Laporan_Biaya_${startDate}_${endDate}.xlsx"`);
     await workbook.xlsx.write(res);
     res.end();
   } catch (error) { console.error('Error exporting Biaya to Excel:', error); res.status(500).send(`Gagal mengekspor laporan Biaya: ${error.message}`); }
};

// --- Fungsi Ekspor Margin (SUDAH DIPERBAIKI) ---
exports.exportMarginToExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).send('Parameter startDate dan endDate diperlukan.');
        const { saldoAwal, transaksi } = await getLaporanMarginData(startDate, endDate);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Aplikasi SPBU'; workbook.lastModifiedBy = 'Aplikasi SPBU'; workbook.created = new Date(); workbook.modified = new Date();
        const worksheet = workbook.addWorksheet('Laporan Margin');
        
        worksheet.mergeCells('A1:G1'); worksheet.getCell('A1').value = 'Laporan Margin SPBU Kolongan'; worksheet.getCell('A1').font = { size: 16, bold: true }; worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        worksheet.mergeCells('A3:G3'); worksheet.getCell('A3').value = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`; worksheet.getCell('A3').font = { italic: true }; worksheet.getCell('A3').alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(['Tanggal', 'Kode', 'Uraian', 'Uang Masuk (Margin)', 'Uang Keluar (Biaya)', 'Sisa Saldo (Kas)', 'Keterangan']);
        headerRow.eachCell((cell) => cell.style = headerStyle); headerRow.height = 30;
        
        const columnWidthsMargin = [15, 15, 40, 20, 20, 25, 30];
        const updateColWidthMargin = (colIndex, textLength) => { if (colIndex === 0) { columnWidthsMargin[0] = Math.max(columnWidthsMargin[0], 15); return; } const currentLength = textLength + 2; if (currentLength > columnWidthsMargin[colIndex]) columnWidthsMargin[colIndex] = currentLength; };
        
        const saldoAwalNum = parseFloat(saldoAwal) || 0;
        let startDateObjMargin = new Date(startDate); if (isNaN(startDateObjMargin.getTime())) { startDateObjMargin = startDate; }
        const saldoAwalData = [ startDateObjMargin, '', 'SALDO AWAL (KAS)', '', '', saldoAwalNum, '' ];
        const saldoAwalRow = worksheet.addRow(saldoAwalData);
        worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
        saldoAwalRow.getCell('A').style = dateCellStyle;
        updateColWidthMargin(2, 'SALDO AWAL (KAS)'.length);
        saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
        saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahSaldoStyle };
        saldoAwalRow.getCell('B').style = dataCellStyle; saldoAwalRow.getCell('D').style = dataCellStyle; saldoAwalRow.getCell('E').style = dataCellStyle; saldoAwalRow.getCell('G').style = dataCellStyle;
        updateColWidthMargin(5, simpleFormatRupiahForLength(saldoAwalNum).length);
        
        let currentSaldo = saldoAwalNum; let totalMasukPeriode = 0; let totalKeluarPeriode = 0;
        transaksi.forEach(item => {
            const uangMasuk = parseFloat(item.uangMasuk) || 0;
            const uangKeluar = parseFloat(item.uangKeluar) || 0;
            currentSaldo += uangMasuk; currentSaldo -= uangKeluar;
            totalMasukPeriode += uangMasuk; totalKeluarPeriode += uangKeluar;
            let tanggalValue = '-'; try { tanggalValue = new Date(item.tanggal); if (isNaN(tanggalValue.getTime())) tanggalValue = item.tanggal; } catch(e){ tanggalValue = item.tanggal; }
            
            // Uang Keluar dimasukkan sebagai angka NEGATIF
            const rowData = [ tanggalValue, item.kode || '', item.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? -uangKeluar : '', currentSaldo, item.keterangan || '' ];
            const dataRow = worksheet.addRow(rowData);
            
            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                 const colIndex = colNumber - 1; let cellTextLength = 0; let isDate = false;
                 if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                     if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){ cell.style = dateCellStyle; cellTextLength = 10; isDate = true; }
                     else if (typeof cell.value === 'number') { 
                         if (colNumber === 4) { cell.style = rupiahMasukStyle; } // HIJAU
                         else if (colNumber === 5) { cell.style = rupiahKeluarStyle; } // MERAH
                         else if (colNumber === 6) { cell.style = rupiahSaldoStyle; } // Standar
                         else { cell.style = numberCellStyle; }
                         cellTextLength = simpleFormatRupiahForLength(cell.value).length; 
                     }
                     else { cellTextLength = cell.value.toString().length; if (colNumber === 1) cell.style = dataCellStyle; else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle; else if (colNumber === 2) cell.style = centerCellStyle; else cell.style = dataCellStyle; }
                     if(!isDate) updateColWidthMargin(colIndex, cellTextLength);
                 } else { cell.style = dataCellStyle; }
                 
                 // Highlight baris Margin
                 if (item.isMargin) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Kuning Muda
            });
        });
        
        worksheet.addRow([]);
        // Total Keluar dimasukkan sebagai angka NEGATIF
        const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, -totalKeluarPeriode, '', '']);
        worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
        totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
        totalRow.getCell('C').value = 'TOTAL PERIODE';
        totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
        
        totalRow.getCell('D').style = { ...totalStyle, ...rupiahMasukStyle }; // HIJAU
        totalRow.getCell('E').style = { ...totalStyle, ...rupiahKeluarStyle }; // MERAH
        
        totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
        updateColWidthMargin(3, simpleFormatRupiahForLength(totalMasukPeriode).length); updateColWidthMargin(4, simpleFormatRupiahForLength(-totalKeluarPeriode).length);
        
        columnWidthsMargin.forEach((width, index) => { const finalWidth = Math.min(width, 60); worksheet.getColumn(index + 1).width = finalWidth; });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Margin_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { console.error('Error exporting Margin to Excel:', error); res.status(500).send(`Gagal mengekspor laporan Margin: ${error.message}`); }
};