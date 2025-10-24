// public/js/tampilKasPage.js

export class TampilKasPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // ===== KOSONGKAN CONSTRUCTOR DARI ELEMEN DOM =====
    this.startDateInput = null;
    this.endDateInput = null;
    this.filterBtn = null;
    this.exportBtn = null;
    this.tableBody = null;
    this.totalMasukEl = null;
    this.totalKeluarEl = null;
  }

  init() {
    // ===== PERBAIKAN 1: PINDAHKAN PENCARIAN ELEMEN KE SINI =====
    this.startDateInput = document.getElementById('kas-start-date');
    this.endDateInput = document.getElementById('kas-end-date');
    this.filterBtn = document.getElementById('kas-filter-btn');
    this.exportBtn = document.getElementById('kas-export-btn'); 
    this.tableBody = document.getElementById('tabel-laporan-kas-body');
    this.totalMasukEl = document.getElementById('kas-total-masuk');
    this.totalKeluarEl = document.getElementById('kas-total-keluar');

    // ===== PERBAIKAN 2: "PENJAGA" ANTI-CRASH =====
    // Jika elemen kunci tidak ada (kita di halaman lain), hentikan.
    if (!this.filterBtn || !this.tableBody || !this.startDateInput) {
      return;
    }
    
    // Lanjutkan dengan logika asli...
    this._setDefaultDates();
    this._setupEventListeners();
    this.fetchAndDisplayReport(); 
  }
  
  _formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(number));
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
    // Fungsi ini sekarang aman
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
      this.tableBody.innerHTML = '<tr><td colspan="7">Memuat data laporan...</td></tr>';
      
      const laporan = await this.api.get(
        `/api/laporan/kas?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`
      );

      // ===== PERBAIKAN 3: "PENJAGA" ERROR forEach =====
      // Periksa apakah 'laporan' dan 'laporan.transaksi' ada dan merupakan array
      if (!laporan || !Array.isArray(laporan.transaksi)) {
        // Jika tidak, lempar error agar ditangkap oleh blok catch
        throw new Error('Format data laporan kas tidak valid dari server.');
      }
      // ===============================================

      this.tableBody.innerHTML = '';
      
      const { saldoAwal, transaksi } = laporan;
      
      let currentSaldo = saldoAwal;
      let totalMasukPeriode = 0;
      let totalKeluarPeriode = 0;
      
      const saldoAwalRow = document.createElement('tr');
      saldoAwalRow.className = 'saldo-awal-row';
      saldoAwalRow.innerHTML = `
        <td>${this._formatTanggal(startDate)}</td>
        <td colspan="4" class="text-bold">SALDO AWAL</td>
        <td class="text-bold">${this._formatRupiah(currentSaldo)}</td>
        <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);

      // Loop ini sekarang aman
      transaksi.forEach(trx => {
        let uangMasuk = 0;
        let uangKeluar = 0;
        
        if (trx.jenis === 'Penambah') { uangMasuk = trx.total; currentSaldo += trx.total; totalMasukPeriode += trx.total; } 
        else if (trx.jenis === 'Pengurang' || trx.jenis === 'Pindahan') { uangKeluar = trx.total; currentSaldo -= trx.total; totalKeluarPeriode += trx.total; }
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${this._formatTanggal(trx.tanggal)}</td>
          <td>${trx.kode}</td>
          <td>${trx.uraian}</td>
          <td class="uang-masuk">${uangMasuk > 0 ? this._formatRupiah(uangMasuk) : '-'}</td>
          <td class="uang-keluar">${uangKeluar > 0 ? `- ${this._formatRupiah(uangKeluar)}` : '-'}</td>
          <td>${this._formatRupiah(currentSaldo)}</td>
          <td>${trx.keterangan || ''}</td>
        `;
        this.tableBody.appendChild(row);
      });
      
      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      this.totalKeluarEl.innerText = `- ${this._formatRupiah(totalKeluarPeriode)}`;

    } catch (error) {
      this.notification.show('Gagal memuat laporan kas', 'error');
      // Tampilkan error yang lebih spesifik di console
      console.error("Detail Error Laporan Kas:", error.message); 
      this.tableBody.innerHTML = '<tr><td colspan="7">Gagal memuat data. Periksa console.</td></tr>';
    }
  }
  
  _handleExport() {
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi untuk ekspor', 'error');
      return;
    }
    
    const exportUrl = `${this.api.baseUrl}/api/export/kas?startDate=${startDate}&endDate=${endDate}`;
    window.open(exportUrl, '_blank');
  }
}