// public/js/tampilBiayaPage.js

export class TampilBiayaPage {
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
    this.startDateInput = document.getElementById('biaya-start-date');
    this.endDateInput = document.getElementById('biaya-end-date');
    this.filterBtn = document.getElementById('biaya-filter-btn');
    this.exportBtn = document.getElementById('biaya-export-btn');
    this.tableBody = document.getElementById('tabel-laporan-biaya-body');
    this.totalMasukEl = document.getElementById('biaya-total-masuk');
    this.totalKeluarEl = document.getElementById('biaya-total-keluar');

    // Penjaga anti-crash
    if (!this.filterBtn || !this.tableBody || !this.startDateInput || !this.totalMasukEl || !this.totalKeluarEl || !this.exportBtn) {
       console.error("TampilBiayaPage: Salah satu elemen kunci tidak ditemukan.");
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
    // Tampilkan positif (warna dari CSS)
    return formatted;
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
    // Pastikan listener hanya ditambahkan sekali jika init() terpanggil > 1 kali
    if (this._listenersAttached) return;
    this.filterBtn.addEventListener('click', () => this.fetchAndDisplayReport());
    this.exportBtn.addEventListener('click', () => this._handleExport());
    this._listenersAttached = true;
  }

  async fetchAndDisplayReport() {
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi', 'error');
      return;
    }

    try {
      this.tableBody.innerHTML = '<tr><td colspan="7">Memuat data laporan...</td></tr>'; // Colspan 7

      const laporan = await this.api.get(`/api/laporan/biaya?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`);

      if (!laporan || !Array.isArray(laporan.transaksi)) {
         if (laporan && laporan.error) { throw new Error(`Server Error: ${laporan.error}`); }
         else { throw new Error('Format data laporan biaya tidak valid dari server.'); }
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
        <td colspan="4" class="text-bold">SALDO AWAL</td>
        <td class="text-right text-bold">${this._formatRupiah(currentSaldo)}</td>
        <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);

      transaksi.forEach(trx => {
        let uangMasuk = 0;
        let uangKeluar = 0;
        const totalAngka = parseFloat(trx.total) || 0;

        if (trx.jenis === 'Penambah') {
          uangMasuk = totalAngka;
          currentSaldo += totalAngka;
          totalMasukPeriode += totalAngka;
        } else {
          uangKeluar = totalAngka;
          currentSaldo -= totalAngka;
          totalKeluarPeriode += totalAngka;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${this._formatTanggal(trx.tanggal)}</td>
          <td>${trx.kode}</td>
          <td>${trx.uraian}</td>
          <td class="text-right uang-masuk">${uangMasuk > 0 ? this._formatRupiah(uangMasuk) : '-'}</td>
          <td class="text-right uang-keluar">${uangKeluar > 0 ? this._formatRupiah(uangKeluar) : '-'}</td>
          <td class="text-right">${this._formatRupiah(currentSaldo)}</td>
          <td>${trx.keterangan || ''}</td>
        `;
        this.tableBody.appendChild(row);
      });

      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      this.totalKeluarEl.innerText = this._formatRupiah(totalKeluarPeriode); // Tampilkan positif

    } catch (error) {
      this.notification.show('Gagal memuat laporan biaya', 'error');
      console.error("Detail Error Laporan Biaya:", error);
      this.tableBody.innerHTML = `<tr><td colspan="7">Gagal memuat data. (${error.message})</td></tr>`;
      // Reset total jika error
      this.totalMasukEl.innerText = this._formatRupiah(0);
      this.totalKeluarEl.innerText = this._formatRupiah(0);
    }
  }

  _handleExport() {
    console.log("Memulai _handleExport Biaya...");
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi untuk ekspor', 'error');
      console.error("Tanggal filter kosong saat ekspor Biaya.");
      return;
    }

    // ===== PERBAIKAN: Gunakan URL relatif =====
    const exportUrl = `/api/export/biaya?startDate=${startDate}&endDate=${endDate}`;
    // =======================================

    console.log("Membuka URL Ekspor Biaya:", exportUrl);
    window.open(exportUrl, '_blank');
  }
}