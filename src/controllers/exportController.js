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
const dateCellStyle = { // Style khusus untuk tanggal
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
  numFmt: 'dd/mm/yyyy' // Format tanggal langsung di style
};
const numberCellStyle = { // Style khusus untuk angka biasa (jika ada)
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true }
};
const rupiahCellStyle = { // Style khusus untuk Rupiah
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'right', wrapText: true },
    numFmt: '"Rp"#,##0;[Red]"Rp"\\(#,##0\\)'
};
const centerCellStyle = { // Style khusus untuk tengah
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    alignment: { vertical: 'top', horizontal: 'center', wrapText: true }
};


// Format Excel (Hanya untuk referensi, format asli ada di style di atas)
const rupiahFormat = '"Rp"#,##0;[Red]"Rp"\\(#,##0\\)';
const dateFormat = 'dd/mm/yyyy';

// Helper sederhana untuk format Rupiah (hanya untuk kalkulasi lebar)
function simpleFormatRupiahForLength(number) {
    if (isNaN(Number(number))) return '';
    return `Rp ${Math.abs(Number(number)).toLocaleString('id-ID')}`;
}


// --- Fungsi Ekspor Kas (DIPERBAIKI FORMAT TANGGAL) ---
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
    const columnWidths = [15, 15, 40, 20, 20, 25, 30]; // Default
    const updateColumnWidth = (colIndex, textLength) => {
        if (colIndex === 0) { columnWidths[0] = Math.max(columnWidths[0], 15); return; } // Min width for date
        const currentLength = textLength + 2; if (currentLength > columnWidths[colIndex]) columnWidths[colIndex] = currentLength;
    };

    // Baris Saldo Awal
    const saldoAwalNum = parseFloat(saldoAwal) || 0;
    let startDateObj = new Date(startDate); if (isNaN(startDateObj.getTime())) { startDateObj = startDate; }
    const saldoAwalData = [ startDateObj, '', 'SALDO AWAL', '', '', saldoAwalNum, '' ];
    const saldoAwalRow = worksheet.addRow(saldoAwalData);
    worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
    // ===== PERBAIKAN: Gunakan style tanggal yang sudah ada formatnya =====
    const cellA_Saldo = saldoAwalRow.getCell('A');
    cellA_Saldo.style = dateCellStyle; // Terapkan style tanggal
    // =================================================================
    updateColumnWidth(2, 'SALDO AWAL'.length);
    saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
    saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahCellStyle }; // Gunakan style rupiah
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

      const rowData = [ tanggalValue, trx.kode || '', trx.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? uangKeluar : '', currentSaldo, trx.keterangan || '' ];
      const dataRow = worksheet.addRow(rowData);

      // Apply styling & Hitung Lebar Kolom
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
         const colIndex = colNumber - 1;
         let cellTextLength = 0;
         let isDate = false;

         if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
             if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){
                 // ===== PERBAIKAN: Terapkan dateCellStyle =====
                 cell.style = dateCellStyle;
                 // ==========================================
                 cellTextLength = 10; // dd/mm/yyyy
                 isDate = true;
             } else if (typeof cell.value === 'number') {
                 if (colNumber >= 4 && colNumber <= 6) { // Kolom Rupiah
                     cell.style = rupiahCellStyle; // Gunakan style rupiah
                     if (colNumber === 5 && uangKeluar > 0) cell.font = { color: { argb: 'FFFF0000' } };
                     cellTextLength = simpleFormatRupiahForLength(cell.value).length;
                 } else { // Angka biasa
                     cell.style = numberCellStyle; // Gunakan style angka
                     cellTextLength = cell.value.toString().length;
                 }
             } else { // String
                 cellTextLength = cell.value.toString().length;
                 if (colNumber === 1) cell.style = dataCellStyle; // Tanggal fallback, style biasa
                 else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle; // Uraian, Ket rata kiri
                 else if (colNumber === 2) cell.style = centerCellStyle; // Kode rata tengah
                 else cell.style = dataCellStyle; // Default kiri
             }
             if (!isDate) { // Jangan update width berdasarkan angka tanggal
                updateColumnWidth(colIndex, cellTextLength);
             }
         } else {
             // Beri border untuk sel kosong juga
             cell.style = dataCellStyle;
         }
      });
    });

    // Baris Total Periode
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, totalKeluarPeriode, '', '']);
    worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
    totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
    totalRow.getCell('C').value = 'TOTAL PERIODE';
    totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
    totalRow.getCell('D').style = { ...totalStyle, ...rupiahCellStyle }; // Gabungkan style total & rupiah
    totalRow.getCell('E').style = { ...totalStyle, ...rupiahCellStyle, font: { bold: true, color: { argb: 'FFFF0000' } } }; // Total keluar merah
    totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
    updateColumnWidth(3, simpleFormatRupiahForLength(totalMasukPeriode).length);
    updateColumnWidth(4, simpleFormatRupiahForLength(totalKeluarPeriode).length);

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

// --- Fungsi Ekspor Biaya (PERLU DIPERBAIKI DENGAN LOGIKA TANGGAL SAMA) ---
exports.exportBiayaToExcel = async (req, res) => {
   try {
     const { startDate, endDate } = req.query;
     if (!startDate || !endDate) return res.status(400).send('Parameter startDate dan endDate diperlukan.');
     const { saldoAwal, transaksi } = await getLaporanBiayaData(startDate, endDate);
     const workbook = new ExcelJS.Workbook(); /* ... setup ... */
     const worksheet = workbook.addWorksheet('Laporan Biaya');
     // Judul, Tanggal, Header (7 kolom)
     worksheet.mergeCells('A1:G1'); worksheet.getCell('A1').value = 'Laporan Biaya SPBU Kolongan'; /* Style Title */ worksheet.getCell('A1').font = { size: 16, bold: true }; worksheet.getCell('A1').alignment = { horizontal: 'center' };
     worksheet.addRow([]);
     worksheet.mergeCells('A3:G3'); worksheet.getCell('A3').value = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`; /* Style Date */ worksheet.getCell('A3').font = { italic: true }; worksheet.getCell('A3').alignment = { horizontal: 'center' };
     worksheet.addRow([]);
     const headerRow = worksheet.addRow(['Tanggal', 'Kode', 'Uraian', 'Uang Masuk', 'Uang Keluar', 'Sisa Saldo', 'Keterangan']);
     headerRow.eachCell((cell) => cell.style = headerStyle); headerRow.height = 30;
     // Persiapan Auto Width
     const columnWidthsBiaya = [15, 15, 40, 20, 20, 25, 30];
     const updateColWidthBiaya = (colIndex, textLength) => { if (colIndex === 0) { columnWidthsBiaya[0] = Math.max(columnWidthsBiaya[0], 15); return; } const currentLength = textLength + 2; if (currentLength > columnWidthsBiaya[colIndex]) columnWidthsBiaya[colIndex] = currentLength; };
     // Baris Saldo Awal (Biaya)
     const saldoAwalNum = parseFloat(saldoAwal) || 0;
     let startDateObjBiaya = new Date(startDate); if (isNaN(startDateObjBiaya.getTime())) { startDateObjBiaya = startDate; }
     const saldoAwalData = [ startDateObjBiaya, '', 'SALDO AWAL', '', '', saldoAwalNum, '' ];
     const saldoAwalRow = worksheet.addRow(saldoAwalData);
     worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
     const cellA_SaldoBiaya = saldoAwalRow.getCell('A'); cellA_SaldoBiaya.style = dateCellStyle; // Terapkan style tanggal
     updateColWidthBiaya(2, 'SALDO AWAL'.length);
     saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
     saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahCellStyle }; // Style rupiah
     saldoAwalRow.getCell('B').style = dataCellStyle; saldoAwalRow.getCell('D').style = dataCellStyle; saldoAwalRow.getCell('E').style = dataCellStyle; saldoAwalRow.getCell('G').style = dataCellStyle;
     updateColWidthBiaya(5, simpleFormatRupiahForLength(saldoAwalNum).length);
     // Loop Data Transaksi Biaya
     let currentSaldo = saldoAwalNum; let totalMasukPeriode = 0; let totalKeluarPeriode = 0;
     transaksi.forEach(trx => {
         let uangMasuk = 0; let uangKeluar = 0;
         const totalAngka = parseFloat(trx.total) || 0;
         if (trx.jenis === 'Penambah') { uangMasuk = totalAngka; currentSaldo += totalAngka; totalMasukPeriode += totalAngka; }
         else { uangKeluar = totalAngka; currentSaldo -= totalAngka; totalKeluarPeriode += totalAngka; }
         let tanggalValue = '-'; try { tanggalValue = new Date(trx.tanggal); if (isNaN(tanggalValue.getTime())) tanggalValue = trx.tanggal; } catch(e){ tanggalValue = trx.tanggal; }
         const rowData = [ tanggalValue, trx.kode || '', trx.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? uangKeluar : '', currentSaldo, trx.keterangan || '' ];
         const dataRow = worksheet.addRow(rowData);
         // Apply styling & Hitung Lebar Kolom (Sama seperti Kas)
         dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
             const colIndex = colNumber - 1; let cellTextLength = 0; let isDate = false;
             if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                 if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){ cell.style = dateCellStyle; cellTextLength = 10; isDate = true; } // Terapkan style tanggal
                 else if (typeof cell.value === 'number') { if (colNumber >= 4 && colNumber <= 6) { cell.style = rupiahCellStyle; if (colNumber === 5 && uangKeluar > 0) cell.font = { color: { argb: 'FFFF0000' } }; cellTextLength = simpleFormatRupiahForLength(cell.value).length; } else { cell.style = numberCellStyle; cellTextLength = cell.value.toString().length; } }
                 else { cellTextLength = cell.value.toString().length; if (colNumber === 1) cell.style = dataCellStyle; else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle; else if (colNumber === 2) cell.style = centerCellStyle; else cell.style = dataCellStyle; }
                 if(!isDate) updateColWidthBiaya(colIndex, cellTextLength);
             } else { cell.style = dataCellStyle; }
         });
     });
     // Baris Total Periode Biaya
     worksheet.addRow([]);
     const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, totalKeluarPeriode, '', '']);
     worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
     totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
     totalRow.getCell('C').value = 'TOTAL PERIODE';
     totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
     totalRow.getCell('D').style = { ...totalStyle, ...rupiahCellStyle };
     totalRow.getCell('E').style = { ...totalStyle, ...rupiahCellStyle, font: { bold: true, color: { argb: 'FFFF0000' } } };
     totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
     updateColWidthBiaya(3, simpleFormatRupiahForLength(totalMasukPeriode).length); updateColWidthBiaya(4, simpleFormatRupiahForLength(totalKeluarPeriode).length);
     // Terapkan Auto Width Biaya
     columnWidthsBiaya.forEach((width, index) => { const finalWidth = Math.min(width, 60); worksheet.getColumn(index + 1).width = finalWidth; });
     // Send Response
     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
     res.setHeader('Content-Disposition', `attachment; filename="Laporan_Biaya_${startDate}_${endDate}.xlsx"`);
     await workbook.xlsx.write(res);
     res.end();
   } catch (error) { console.error('Error exporting Biaya to Excel:', error); res.status(500).send(`Gagal mengekspor laporan Biaya: ${error.message}`); }
};

// --- Fungsi Ekspor Margin (PERLU DIPERBAIKI DENGAN LOGIKA TANGGAL SAMA) ---
exports.exportMarginToExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).send('Parameter startDate dan endDate diperlukan.');
        const { saldoAwal, transaksi } = await getLaporanMarginData(startDate, endDate);
        const workbook = new ExcelJS.Workbook(); /* ... setup ... */
        const worksheet = workbook.addWorksheet('Laporan Margin');
        // Judul, Tanggal, Header (7 kolom)
        worksheet.mergeCells('A1:G1'); worksheet.getCell('A1').value = 'Laporan Margin SPBU Kolongan'; /* Style Title */ worksheet.getCell('A1').font = { size: 16, bold: true }; worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        worksheet.mergeCells('A3:G3'); worksheet.getCell('A3').value = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`; /* Style Date */ worksheet.getCell('A3').font = { italic: true }; worksheet.getCell('A3').alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(['Tanggal', 'Kode', 'Uraian', 'Uang Masuk', 'Uang Keluar', 'Sisa Saldo (Kas)', 'Keterangan']);
        headerRow.eachCell((cell) => cell.style = headerStyle); headerRow.height = 30;
        // Persiapan Auto Width
        const columnWidthsMargin = [15, 15, 40, 20, 20, 25, 30];
        const updateColWidthMargin = (colIndex, textLength) => { if (colIndex === 0) { columnWidthsMargin[0] = Math.max(columnWidthsMargin[0], 15); return; } const currentLength = textLength + 2; if (currentLength > columnWidthsMargin[colIndex]) columnWidthsMargin[colIndex] = currentLength; };
        // Baris Saldo Awal (Kas)
        const saldoAwalNum = parseFloat(saldoAwal) || 0;
        let startDateObjMargin = new Date(startDate); if (isNaN(startDateObjMargin.getTime())) { startDateObjMargin = startDate; }
        const saldoAwalData = [ startDateObjMargin, '', 'SALDO AWAL (KAS)', '', '', saldoAwalNum, '' ];
        const saldoAwalRow = worksheet.addRow(saldoAwalData);
        worksheet.mergeCells(`C${saldoAwalRow.number}:E${saldoAwalRow.number}`);
        const cellA_SaldoMargin = saldoAwalRow.getCell('A'); cellA_SaldoMargin.style = dateCellStyle; // Terapkan style tanggal
        updateColWidthMargin(2, 'SALDO AWAL (KAS)'.length);
        saldoAwalRow.getCell('C').style = { font: { bold: true }, alignment: { vertical:'top', horizontal: 'left' }, border: dataCellStyle.border };
        saldoAwalRow.getCell('F').style = { font: { bold: true }, ...rupiahCellStyle }; // Style rupiah
        saldoAwalRow.getCell('B').style = dataCellStyle; saldoAwalRow.getCell('D').style = dataCellStyle; saldoAwalRow.getCell('E').style = dataCellStyle; saldoAwalRow.getCell('G').style = dataCellStyle;
        updateColWidthMargin(5, simpleFormatRupiahForLength(saldoAwalNum).length);
        // Loop Data Transaksi (Margin & Biaya)
        let currentSaldo = saldoAwalNum; let totalMasukPeriode = 0; let totalKeluarPeriode = 0;
        transaksi.forEach(item => {
            const uangMasuk = parseFloat(item.uangMasuk) || 0;
            const uangKeluar = parseFloat(item.uangKeluar) || 0;
            currentSaldo += uangMasuk; currentSaldo -= uangKeluar;
            totalMasukPeriode += uangMasuk; totalKeluarPeriode += uangKeluar;
            let tanggalValue = '-'; try { tanggalValue = new Date(item.tanggal); if (isNaN(tanggalValue.getTime())) tanggalValue = item.tanggal; } catch(e){ tanggalValue = item.tanggal; }
            const rowData = [ tanggalValue, item.kode || '', item.uraian || '', uangMasuk > 0 ? uangMasuk : '', uangKeluar > 0 ? uangKeluar : '', currentSaldo, item.keterangan || '' ];
            const dataRow = worksheet.addRow(rowData);
            // Apply styling & Hitung Lebar Kolom
            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                 const colIndex = colNumber - 1; let cellTextLength = 0; let isDate = false;
                 if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                     if(colNumber === 1 && typeof cell.value === 'object' && cell.value instanceof Date){ cell.style = dateCellStyle; cellTextLength = 10; isDate = true; } // Terapkan style tanggal
                     else if (typeof cell.value === 'number') { if (colNumber >= 4 && colNumber <= 6) { cell.style = rupiahCellStyle; if (colNumber === 5 && uangKeluar > 0 && !item.isMargin) cell.font = { color: { argb: 'FFFF0000' } }; cellTextLength = simpleFormatRupiahForLength(cell.value).length; } else { cell.style = numberCellStyle; cellTextLength = cell.value.toString().length; } }
                     else { cellTextLength = cell.value.toString().length; if (colNumber === 1) cell.style = dataCellStyle; else if (colNumber === 3 || colNumber === 7) cell.style = dataCellStyle; else if (colNumber === 2) cell.style = centerCellStyle; else cell.style = dataCellStyle; }
                     if(!isDate) updateColWidthMargin(colIndex, cellTextLength);
                 } else { cell.style = dataCellStyle; }
                 // Highlight baris Margin
                 if (item.isMargin) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Kuning Muda
            });
        });
        // Baris Total Periode Margin
        worksheet.addRow([]);
        const totalRow = worksheet.addRow(['', '', 'TOTAL PERIODE', totalMasukPeriode, totalKeluarPeriode, '', '']);
        worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
        totalRow.getCell('A').style = totalStyle; totalRow.getCell('B').style = totalStyle;
        totalRow.getCell('C').value = 'TOTAL PERIODE';
        totalRow.getCell('C').style = { ...totalStyle, alignment: { horizontal: 'right'} };
        totalRow.getCell('D').style = { ...totalStyle, ...rupiahCellStyle }; // Total Masuk (Margin)
        totalRow.getCell('E').style = { ...totalStyle, ...rupiahCellStyle, font: { bold: true, color: { argb: 'FFFF0000' } } }; // Total Keluar (Biaya)
        totalRow.getCell('F').style = totalStyle; totalRow.getCell('G').style = totalStyle;
        updateColWidthMargin(3, simpleFormatRupiahForLength(totalMasukPeriode).length); updateColWidthMargin(4, simpleFormatRupiahForLength(totalKeluarPeriode).length);
        // Terapkan Auto Width Margin
        columnWidthsMargin.forEach((width, index) => { const finalWidth = Math.min(width, 60); worksheet.getColumn(index + 1).width = finalWidth; });
        // Send Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Margin_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { console.error('Error exporting Margin to Excel:', error); res.status(500).send(`Gagal mengekspor laporan Margin: ${error.message}`); }
};