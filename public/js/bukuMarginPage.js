// public/js/bukuMarginPage.js

export class BukuMarginPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;

    // Kosongkan constructor
    this.startDateInput = null;
    this.endDateInput = null;
    this.filterBtn = null;
    this.exportBtn = null;
    this.tableBody = null;
    this.totalMasukEl = null;
    this.totalKeluarEl = null;
    this._listenersAttached = false; // Flag listener
  }

  init() {
    // Cari elemen di sini
    this.startDateInput = document.getElementById('margin-start-date');
    this.endDateInput = document.getElementById('margin-end-date');
    this.filterBtn = document.getElementById('margin-filter-btn');
    this.exportBtn = document.getElementById('margin-export-excel-btn');
    this.tableBody = document.getElementById('tabel-laporan-margin-body');
    this.totalMasukEl = document.getElementById('margin-total-masuk');
    this.totalKeluarEl = document.getElementById('margin-total-keluar');

    // Penjaga anti-crash
    if (!this.filterBtn || !this.tableBody || !this.startDateInput || !this.totalMasukEl || !this.totalKeluarEl || !this.exportBtn) {
       console.error("BukuMarginPage: Salah satu elemen kunci tidak ditemukan.");
      return;
    }

    this._setDefaultDates();
    this._setupEventListeners();
    this.fetchAndDisplayReport();
  }

  // ================== FUNGSI FORMAT DIPERBARUI ==================
  /**
   * Formatter Rupiah Serbaguna
   * @param {number} number - Angka yang akan diformat
   * @param {'default' | 'saldo' | 'keluar'} [mode='default'] - Mode format
   */
  _formatRupiah(number, mode = 'default') {
    const num = Number(number);
    
    // Tentukan tampilan untuk 0
    if (isNaN(num) || num === 0) {
      // 'saldo' menampilkan Rp 0, mode lain menampilkan '-'
      return (mode === 'saldo') ? 'Rp 0' : '-';
    }

    // Buat formatter
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    if (mode === 'saldo') {
      // SISA SALDO: Bisa positif atau negatif
      if (num < 0) {
        const formattedAbs = formatter.format(Math.abs(num)); // Hasil: "Rp 34.466.647"
        const formattedNegative = formattedAbs.replace('Rp', '-Rp'); // Hasil: "-Rp 34.466.647"
        return `<span class="text-danger">${formattedNegative}</span>`;
      }
      return formatter.format(num); // Positif atau 0

    } else if (mode === 'keluar') {
      // UANG KELUAR: Selalu merah
      const formatted = formatter.format(num);
      return `<span class="text-danger">${formatted}</span>`;

    } else {
      // UANG MASUK (default): Positif saja, hijau
      const formatted = formatter.format(num);
      return `<span class="text-success">${formatted}</span>`; // Asumsi ada .text-success
    }
  }
  // ================== AKHIR FUNGSI BARU ==================

  _formatTanggal(dateString) {
     try {
       const date = new Date(dateString);
       if (isNaN(date.getTime())) { return dateString; }
       return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
     } catch (e) { return dateString; }
  }

  _setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    this.endDateInput.value = today.toISOString().split('T')[0];
  }

  _setupEventListeners() {
    if (this._listenersAttached) return;
    this.filterBtn.addEventListener('click', () => this.fetchAndDisplayReport());
    this.exportBtn.addEventListener('click', () => this._handleExportExcel());
    this._listenersAttached = true;
  }

  async fetchAndDisplayReport() {
    console.log("Memulai fetchAndDisplayReport Buku Margin...");
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi', 'error');
      return;
    }

    try {
      this.tableBody.innerHTML = '<tr><td colspan="7">Memuat data laporan margin...</td></tr>';

      const apiUrl = `/api/laporan/margin?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`;
      console.log("Memanggil API:", apiUrl);
      const laporan = await this.api.get(apiUrl);
      console.log("Respon API diterima:", laporan);

      if (!laporan || !Array.isArray(laporan.transaksi)) {
         if (laporan && laporan.error) { throw new Error(`Server Error: ${laporan.error}`); }
         else { throw new Error('Format respon API tidak valid atau data tidak ditemukan.'); }
      }

      this.tableBody.innerHTML = '';
      const { saldoAwal, transaksi } = laporan;

      let currentSaldo = parseFloat(saldoAwal) || 0;
      let totalMasukPeriode = 0;
      let totalKeluarPeriode = 0;

      const saldoAwalRow = document.createElement('tr');
      saldoAwalRow.className = 'saldo-awal-row';
      saldoAwalRow.innerHTML = `
        <td>${this._formatTanggal(startDate)}</td>
        <td colspan="4" class="text-bold">SALDO AWAL (KAS)</td>
        <td class="text-right text-bold">${this._formatRupiah(currentSaldo, 'saldo')}</td>
        <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);

      transaksi.forEach(item => {
          const uangMasuk = parseFloat(item.uangMasuk) || 0;
          const uangKeluar = parseFloat(item.uangKeluar) || 0;

          // Perhitungan saldo sudah benar, currentSaldo akan negatif jika perlu
          currentSaldo += uangMasuk;
          currentSaldo -= uangKeluar;

          totalMasukPeriode += uangMasuk;
          totalKeluarPeriode += uangKeluar;

          const row = document.createElement('tr');
          // Highlight baris margin
          if (item.isMargin) {
            row.classList.add('margin-highlight');
          }

          row.innerHTML = `
              <td>${this._formatTanggal(item.tanggal)}</td>
              <td>${item.kode || '-'}</td>
              <td>${item.uraian || 'Tidak ada uraian'}</td>
              <td class="text-right">${this._formatRupiah(uangMasuk, 'default')}</td>
              <td class="text-right">${this._formatRupiah(uangKeluar, 'keluar')}</td>
              <td class="text-right">${this._formatRupiah(currentSaldo, 'saldo')}</td>
              <td>${item.keterangan || ''}</td>
          `;
          this.tableBody.appendChild(row);
      });

      // ================== PERBAIKAN FORMAT TOTAL ==================
      // Gunakan innerHTML karena fungsi format mengembalikan HTML (dengan <span>)
      this.totalMasukEl.innerHTML = this._formatRupiah(totalMasukPeriode, 'default');
      this.totalKeluarEl.innerHTML = this._formatRupiah(totalKeluarPeriode, 'keluar');
      // ============================================================
      console.log("Render tabel selesai.");

    // ================== PERBAIKAN SYNTAX ERROR ==================
    } catch (error) { // <-- Tambahkan '{'
      this.notification.show('Gagal memuat laporan margin', 'error');
      console.error("Error di fetchAndDisplayReport Buku Margin:", error);
      // Pastikan this.tableBody ada sebelum diubah
      if (this.tableBody) {
        this.tableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
      }
      
      // Pastikan elemen total ada sebelum diubah
      if (this.totalMasukEl) {
        this.totalMasukEl.innerHTML = this._formatRupiah(0, 'saldo');
      }
      if (this.totalKeluarEl) {
        this.totalKeluarEl.innerHTML = this._formatRupiah(0, 'keluar');
      }
    } // <-- Tambahkan '}'
    // ============================================================
  }

  _handleExportExcel() {
    console.log("Memulai _handleExportExcel Margin...");
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Pilih tanggal filter terlebih dahulu', 'error');
      console.error("Tanggal filter kosong saat ekspor Margin.");
      return;
    }
    
    const exportUrl = `/api/export/margin?startDate=${startDate}&endDate=${endDate}`;
    
    console.log("Membuka URL Ekspor Margin:", exportUrl);
    window.open(exportUrl, '_blank');
  }
}