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

  _formatRupiah(number) {
    if (number === null || number === undefined || isNaN(Number(number))) { return 'Rp 0'; }
    const isNegative = Number(number) < 0;
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(Number(number)));
    return formatted; // Tampilkan positif
  }

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
    // Pastikan ID tombol ekspor ('margin-export-excel-btn') memanggil fungsi yang benar
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
      this.tableBody.innerHTML = '<tr><td colspan="7">Memuat data laporan margin...</td></tr>'; // Colspan 7

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
        <td class="text-right text-bold">${this._formatRupiah(currentSaldo)}</td>
        <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);

      transaksi.forEach(item => {
          const uangMasuk = parseFloat(item.uangMasuk) || 0;
          const uangKeluar = parseFloat(item.uangKeluar) || 0;

          currentSaldo += uangMasuk;
          currentSaldo -= uangKeluar;

          totalMasukPeriode += uangMasuk;
          totalKeluarPeriode += uangKeluar;

          const row = document.createElement('tr');
          const rowClass = item.isMargin ? 'margin-row' : 'biaya-row';
          row.className = rowClass;

          row.innerHTML = `
              <td>${this._formatTanggal(item.tanggal)}</td>
              <td>${item.kode || '-'}</td>
              <td>${item.uraian || 'Tidak ada uraian'}</td>
              <td class="text-right uang-masuk">${uangMasuk > 0 ? this._formatRupiah(uangMasuk) : '-'}</td>
              <td class="text-right uang-keluar">${uangKeluar > 0 ? this._formatRupiah(uangKeluar) : '-'}</td>
              <td class="text-right">${this._formatRupiah(currentSaldo)}</td>
              <td>${item.keterangan || ''}</td>
          `;
          this.tableBody.appendChild(row);
      });

      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      this.totalKeluarEl.innerText = this._formatRupiah(totalKeluarPeriode); // Tampilkan positif
      console.log("Render tabel selesai.");

    } catch (error) {
      this.notification.show('Gagal memuat laporan margin', 'error');
      console.error("Error di fetchAndDisplayReport Buku Margin:", error);
      this.tableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
      // Reset total jika error
      this.totalMasukEl.innerText = this._formatRupiah(0);
      this.totalKeluarEl.innerText = this._formatRupiah(0);
    }
  }

  _handleExportExcel() { // Nama fungsi sesuai listener
    console.log("Memulai _handleExportExcel Margin...");
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Pilih tanggal filter terlebih dahulu', 'error');
      console.error("Tanggal filter kosong saat ekspor Margin.");
      return;
    }

    // ===== PERBAIKAN: Gunakan URL relatif =====
    const exportUrl = `/api/export/margin?startDate=${startDate}&endDate=${endDate}`;
    // =======================================

    console.log("Membuka URL Ekspor Margin:", exportUrl);
    window.open(exportUrl, '_blank');
  }
}