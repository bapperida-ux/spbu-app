// public/js/tampilBiayaPage.js

export class TampilBiayaPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;

    // Constructor sudah benar (Kosong)
    this.startDateInput = null;
    this.endDateInput = null;
    this.filterBtn = null;
    this.exportBtn = null;
    this.tableBody = null;
    this.totalMasukEl = null;
    this.totalKeluarEl = null;
  }

  init() {
    // Fungsi init() sudah benar (anti-crash)
    this.startDateInput = document.getElementById('biaya-start-date');
    this.endDateInput = document.getElementById('biaya-end-date');
    this.filterBtn = document.getElementById('biaya-filter-btn');
    this.exportBtn = document.getElementById('biaya-export-btn');
    this.tableBody = document.getElementById('tabel-laporan-biaya-body');
    this.totalMasukEl = document.getElementById('biaya-total-masuk');
    this.totalKeluarEl = document.getElementById('biaya-total-keluar');

    // Penjaga anti-crash
    if (!this.filterBtn || !this.tableBody || !this.startDateInput || !this.totalMasukEl || !this.totalKeluarEl) {
       console.error("TampilBiayaPage: Salah satu elemen kunci tidak ditemukan.");
      return;
    }

    this._setDefaultDates();
    this._setupEventListeners();
    this.fetchAndDisplayReport();
  }

  _formatRupiah(number) {
    // Format positif atau negatif dengan kurung
    const isNegative = number < 0;
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(number));
    // return isNegative ? `(${formatted})` : formatted; // Opsi 1: Pakai kurung
     return isNegative ? `${formatted}` : formatted; // Opsi 2: Tampilkan positif saja (sesuai Tampil Kas)
  }

  _formatTanggal(dateString) {
     const date = new Date(dateString);
     return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  _setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    this.endDateInput.value = today.toISOString().split('T')[0];
  }

  _setupEventListeners() {
    this.filterBtn.addEventListener('click', () => this.fetchAndDisplayReport());
    this.exportBtn.addEventListener('click', () => this._handleExport());
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

      const laporan = await this.api.get(
        `/api/laporan/biaya?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`
      );

      // Penjaga forEach sudah benar
      if (!laporan || !Array.isArray(laporan.transaksi)) {
        // Cek apakah ada error dari server
        if (laporan && laporan.error) {
             throw new Error(`Server Error: ${laporan.error}`);
        } else {
            throw new Error('Format data laporan biaya tidak valid dari server.');
        }
      }

      this.tableBody.innerHTML = '';

      const { saldoAwal, transaksi } = laporan;

      // ===== PERBAIKAN KALKULASI: Gunakan saldoAwal dari backend =====
      let currentSaldo = parseFloat(saldoAwal) || 0; // Mulai dari saldo awal biaya
      let totalMasukPeriode = 0;
      let totalKeluarPeriode = 0;

      // ===== TAMPILKAN BARIS SALDO AWAL (dengan teks baru) =====
      const saldoAwalRow = document.createElement('tr');
      saldoAwalRow.className = 'saldo-awal-row';
      saldoAwalRow.innerHTML = `
        <td>${this._formatTanggal(startDate)}</td>
        <td colspan="4" class="text-bold">SALDO AWAL</td> <td class="text-bold">${this._formatRupiah(currentSaldo)}</td> <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);
      // ============================================

      transaksi.forEach(trx => {
        // Logika +/- berdasarkan jenis sudah benar
        let uangMasuk = 0;
        let uangKeluar = 0;
        const totalAngka = parseFloat(trx.total) || 0;

        if (trx.jenis === 'Penambah') {
          uangMasuk = totalAngka;
          currentSaldo += totalAngka;
          totalMasukPeriode += totalAngka;
        }
        else { // Asumsikan Pengurang atau Pindahan
          uangKeluar = totalAngka;
          currentSaldo -= totalAngka;
          totalKeluarPeriode += totalAngka;
        }

        const row = document.createElement('tr');

        // HTML baris sudah benar (7 kolom)
        row.innerHTML = `
          <td>${this._formatTanggal(trx.tanggal)}</td>
          <td>${trx.kode}</td>
          <td>${trx.uraian}</td>
          <td class="uang-masuk">${uangMasuk > 0 ? this._formatRupiah(uangMasuk) : '-'}</td>
          <td class="uang-keluar">${uangKeluar > 0 ? this._formatRupiah(uangKeluar) : '-'}</td> <td>${this._formatRupiah(currentSaldo)}</td> <td>${trx.keterangan || ''}</td>
        `;

        this.tableBody.appendChild(row);
      });

      // Update total footer
      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      this.totalKeluarEl.innerText = this._formatRupiah(totalKeluarPeriode); // Merah tanpa minus

    } catch (error) {
      this.notification.show('Gagal memuat laporan biaya', 'error');
      console.error("Detail Error Laporan Biaya:", error); // Tampilkan error asli
      this.tableBody.innerHTML = `<tr><td colspan="7">Gagal memuat data. (${error.message})</td></tr>`; // Colspan 7
    }
  }

  _handleExport() {
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi untuk ekspor', 'error');
      return;
    }

    const exportUrl = `${this.api.baseUrl}/api/export/biaya?startDate=${startDate}&endDate=${endDate}`;
    window.open(exportUrl, '_blank');
  }
}