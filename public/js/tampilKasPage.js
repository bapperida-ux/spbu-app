// public/js/tampilKasPage.js

export class TampilKasPage {
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
    this.startDateInput = document.getElementById('kas-start-date');
    this.endDateInput = document.getElementById('kas-end-date');
    this.filterBtn = document.getElementById('kas-filter-btn');
    this.exportBtn = document.getElementById('kas-export-btn');
    this.tableBody = document.getElementById('tabel-laporan-kas-body');
    this.totalMasukEl = document.getElementById('kas-total-masuk');
    this.totalKeluarEl = document.getElementById('kas-total-keluar');

    // Penjaga anti-crash
    if (!this.filterBtn || !this.tableBody || !this.startDateInput || !this.totalMasukEl || !this.totalKeluarEl || !this.exportBtn) {
       console.error("TampilKasPage: Salah satu elemen kunci tidak ditemukan.");
      return;
    }

    this._setDefaultDates();
    this._setupEventListeners();
    this.fetchAndDisplayReport();
  }

  _formatRupiah(number) {
    // Fungsi ini tetap sama, untuk format nilai positif (Uang Masuk/Keluar)
    if (number === null || number === undefined || isNaN(Number(number))) { return 'Rp 0'; }
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(Number(number))); // Selalu positif
    return formatted;
  }

  // ================== FUNGSI BARU DITAMBAHKAN ==================
  /**
   * Memformat angka menjadi Rupiah, khusus untuk Sisa Saldo.
   * Menampilkan tanda negatif dan warna merah jika saldo minus.
   */
  _formatSisaSaldo(number) {
    const num = Number(number);
    if (isNaN(num)) {
      return 'Rp 0';
    }

    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    if (num < 0) {
      // 1. Ambil nilai absolut (positif)
      const absoluteVal = Math.abs(num);
      // 2. Format nilai absolutnya (hasil: "Rp 19.900.000")
      const formattedAbs = formatter.format(absoluteVal);
      // 3. Ganti "Rp" dengan "-Rp"
      const formattedNegative = formattedAbs.replace('Rp', '-Rp');
      // 4. Bungkus dengan span untuk warna merah
      return `<span class="text-danger">${formattedNegative}</span>`;
    } else {
      // Format positif seperti biasa
      return formatter.format(num);
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

      const laporan = await this.api.get(`/api/laporan/kas?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`);

      if (!laporan || !Array.isArray(laporan.transaksi)) {
         if (laporan && laporan.error) { throw new Error(`Server Error: ${laporan.error}`); }
         else { throw new Error('Format data laporan kas tidak valid dari server.'); }
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
        
        <td class="text-right text-bold">${this._formatSisaSaldo(currentSaldo)}</td>
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
        } else { // Asumsikan Pengurang atau Pindahan
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
          
          <td class="text-right">${this._formatSisaSaldo(currentSaldo)}</td>
          <td>${trx.keterangan || ''}</td>
        `;
        this.tableBody.appendChild(row);
      });

      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      this.totalKeluarEl.innerText = this._formatRupiah(totalKeluarPeriode); // Tampilkan positif

    } catch (error) {
      this.notification.show('Gagal memuat laporan kas', 'error');
      console.error("Detail Error Laporan Kas:", error);
      this.tableBody.innerHTML = `<tr><td colspan="7">Gagal memuat data. (${error.message})</td></tr>`;
      // Reset total jika error
      this.totalMasukEl.innerText = this._formatRupiah(0);
      this.totalKeluarEl.innerText = this._formatRupiah(0);
    }
  }

  _handleExport() {
    console.log("Memulai _handleExport Kas...");
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi untuk ekspor', 'error');
      console.error("Tanggal filter kosong saat ekspor Kas.");
      return;
    }

    // ===== PERBAIKAN: Gunakan URL relatif =====
    const exportUrl = `/api/export/kas?startDate=${startDate}&endDate=${endDate}`;
    // =======================================

    console.log("Membuka URL Ekspor Kas:", exportUrl);
    window.open(exportUrl, '_blank');
  }
}