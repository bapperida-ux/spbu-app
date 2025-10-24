// public/js/bukuMarginPage.js

export class BukuMarginPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // ===== KOSONGKAN CONSTRUCTOR (MEMPERBAIKI MENU) =====
    this.startDateInput = null;
    this.endDateInput = null;
    this.filterBtn = null;
    this.exportBtn = null;
    this.tableBody = null;
    this.totalMasukEl = null;
    this.totalKeluarEl = null;
  }

  init() {
    // ===== PERBAIKAN 1: "PENJAGA" ANTI-CRASH (MEMPERBAIKI MENU) =====
    this.startDateInput = document.getElementById('margin-start-date');
    this.endDateInput = document.getElementById('margin-end-date');
    this.filterBtn = document.getElementById('margin-filter-btn');
    this.exportBtn = document.getElementById('margin-export-excel-btn'); 
    this.tableBody = document.getElementById('tabel-laporan-margin-body');
    this.totalMasukEl = document.getElementById('margin-total-masuk');
    this.totalKeluarEl = document.getElementById('margin-total-keluar');

    // Jika salah satu elemen kunci tidak ada, hentikan.
    if (!this.filterBtn || !this.tableBody || !this.startDateInput || !this.totalMasukEl || !this.totalKeluarEl) {
       console.error("BukuMarginPage: Salah satu elemen kunci tidak ditemukan.");
      return; 
    }
    
    this._setDefaultDates();
    this._setupEventListeners();
    this.fetchAndDisplayReport(); 
  }
  
  _formatRupiah(number) {
    // Format positif atau negatif dengan kurung
    if (number === null || number === undefined || isNaN(Number(number))) {
        return 'Rp 0'; 
    }
    const isNegative = Number(number) < 0;
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.abs(Number(number)));
    // Tampilkan positif saja agar konsisten
    return formatted; 
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
    this.exportBtn.addEventListener('click', () => this._handleExportExcel());
  }
  
  async fetchAndDisplayReport() {
    console.log("Memulai fetchAndDisplayReport Buku Margin..."); // Debugging
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Tanggal Awal dan Akhir harus diisi', 'error');
      console.error("Tanggal filter kosong."); // Debugging
      return;
    }

    try {
      this.tableBody.innerHTML = '<tr><td colspan="7">Memuat data laporan margin...</td></tr>'; // Colspan 7
      
      const apiUrl = `/api/laporan/margin?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`;
      console.log("Memanggil API:", apiUrl); // Debugging
      const laporan = await this.api.get(apiUrl);
      console.log("Respon API diterima:", laporan); // Debugging

      // ===== PERBAIKAN 2: "PENJAGA" ERROR forEach =====
      if (!laporan || !Array.isArray(laporan.transaksi)) {
         // Cek jika ada pesan error dari server
         if (laporan && laporan.error) {
             throw new Error(`Server Error: ${laporan.error}`);
         } else {
            throw new Error('Format respon API tidak valid atau data tidak ditemukan.');
         }
      }
      // ===============================================

      this.tableBody.innerHTML = '';
      
      const { saldoAwal, transaksi } = laporan;
      
      // ===== PERBAIKAN 3: KALKULASI (parseFloat) =====
      let currentSaldo = parseFloat(saldoAwal) || 0; 
      let totalMasukPeriode = 0; 
      let totalKeluarPeriode = 0;
      
      const saldoAwalRow = document.createElement('tr');
      saldoAwalRow.className = 'saldo-awal-row';
      saldoAwalRow.innerHTML = `
        <td>${this._formatTanggal(startDate)}</td>
        <td colspan="4" class="text-bold">SALDO AWAL (KAS)</td> 
        <td class="text-bold">${this._formatRupiah(currentSaldo)}</td> 
        <td></td>
      `;
      this.tableBody.appendChild(saldoAwalRow);

      // Loop ini sekarang aman
      transaksi.forEach(item => {
          // Pastikan uangMasuk dan uangKeluar adalah angka
          const uangMasuk = parseFloat(item.uangMasuk) || 0;
          const uangKeluar = parseFloat(item.uangKeluar) || 0;

          // Update saldo kumulatif
          currentSaldo += uangMasuk;
          currentSaldo -= uangKeluar;

          // Update total periode
          totalMasukPeriode += uangMasuk;
          totalKeluarPeriode += uangKeluar;

          const row = document.createElement('tr');
          // Tentukan kelas CSS berdasarkan jenis item (biaya atau margin)
          const rowClass = item.isMargin ? 'margin-row' : 'biaya-row'; // Misal
          row.className = rowClass;

          // Tampilkan baris
          const displaySaldo = this._formatRupiah(currentSaldo); // Format saldo saat ini
          row.innerHTML = `
              <td>${this._formatTanggal(item.tanggal)}</td>
              <td>${item.kode || '-'}</td>
              <td>${item.uraian || 'Tidak ada uraian'}</td>
              <td class="text-right uang-masuk">${uangMasuk > 0 ? this._formatRupiah(uangMasuk) : '-'}</td>
              <td class="text-right uang-keluar">${uangKeluar > 0 ? this._formatRupiah(uangKeluar) : '-'}</td>
              <td class="text-right">${displaySaldo}</td> 
              <td>${item.keterangan || ''}</td>
          `;
          this.tableBody.appendChild(row);
      });
      
      // Update total footer
      this.totalMasukEl.innerText = this._formatRupiah(totalMasukPeriode);
      // Tampilkan total keluar sebagai positif di footer (warna merah dari CSS)
      this.totalKeluarEl.innerText = this._formatRupiah(totalKeluarPeriode); 
      console.log("Render tabel selesai."); // Debugging
      
    } catch (error) {
      this.notification.show('Gagal memuat laporan margin', 'error');
      console.error("Error di fetchAndDisplayReport Buku Margin:", error);
      // Tampilkan pesan error yang lebih jelas di tabel
      this.tableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
      // Reset total jika error
      this.totalMasukEl.innerText = this._formatRupiah(0);
      this.totalKeluarEl.innerText = this._formatRupiah(0);
    }
  }
  
  _handleExportExcel() {
    console.log("Memulai _handleExportExcel..."); // Debugging
    const startDate = this.startDateInput.value;
    const endDate = this.endDateInput.value;

    if (!startDate || !endDate) {
      this.notification.show('Pilih tanggal filter terlebih dahulu', 'error');
      console.error("Tanggal filter kosong saat ekspor."); // Debugging
      return;
    }
    
    // Pastikan base URL sudah benar (jika apiService punya)
    const baseUrl = this.api.baseUrl || ''; 
    const exportUrl = `${baseUrl}/api/export/margin?startDate=${startDate}&endDate=${endDate}`;
    console.log("Membuka URL Ekspor:", exportUrl); // Debugging
    
    window.open(exportUrl, '_blank');
  }
}