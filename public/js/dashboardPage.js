// public/js/dashboardPage.js

// Import NotificationService if you use it for error handling
// import { NotificationService } from './notificationService.js'; 

export class DashboardPage {
  constructor(apiService, notificationService) { // Added notificationService
    this.api = apiService;
    this.notification = notificationService; // Store notificationService
    
    // Updated element references
    this.saldoBiayaElement = document.getElementById('dashboard-saldo-biaya'); // New element for Saldo Biaya
    this.paidInvoicesEl = document.getElementById('paid-invoices'); // Keep others if they are real
    this.unpaidInvoicesEl = document.getElementById('unpaid-invoices');
    this.totalSentEl = document.getElementById('total-sent');
    this.walletBalanceEl = document.getElementById('wallet-balance');
    this.walletChangeEl = document.getElementById('wallet-change');
  }

  // Fungsi inisialisasi utama (dipanggil oleh app.js)
  init() {
    // Check if the target element exists before proceeding
    if (!this.saldoBiayaElement) {
      console.error("DashboardPage: Element 'dashboard-saldo-biaya' not found.");
      // Optionally stop initialization if the element is crucial
      // return; 
    }
    
    this._fetchSaldoBiaya(); // Fetch the new Saldo Biaya data
    
    // Keep fetching other data if those cards are still relevant
    // this._fetchStats(); // Commented out as other stats cards might be placeholders too
    this._fetchWallet(); 
  }

  // ================== FUNGSI FORMAT RUPIAH (Copy from previous examples) ==================
  /**
   * Formatter Rupiah Serbaguna
   * @param {number} number - Angka yang akan diformat
   * @param {'saldo'} [mode='saldo'] - Mode format (only saldo needed here)
   */
  _formatRupiah(number, mode = 'saldo') {
    const num = Number(number);
    if (isNaN(num)) { return 'Rp 0'; } // Default for NaN

    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    });

    if (mode === 'saldo') {
      if (num < 0) {
        const formattedAbs = formatter.format(Math.abs(num));
        const formattedNegative = formattedAbs.replace('Rp', '-Rp');
        return `<span class="text-danger">${formattedNegative}</span>`; 
      }
      return formatter.format(num); 
    }
    // Fallback for other modes if ever needed
    return formatter.format(num);
  }
  // ================== AKHIR FUNGSI FORMAT ==================

  // ================== FUNGSI BARU UNTUK SALDO BIAYA ==================
  async _fetchSaldoBiaya() {
    // Ensure the element exists before trying to update it
    if (!this.saldoBiayaElement) return; 

    try {
      // Use a very early start date to get the true current balance
      const startDate = '2020-01-01'; // Or fetch the actual first transaction date if available
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];

      // Fetch the full expense report data using the existing API endpoint
      const laporan = await this.api.get(`/api/laporan/biaya?startDate=${startDate}&endDate=${endDate}&_=${new Date().getTime()}`);

      if (!laporan || !Array.isArray(laporan.transaksi)) {
        throw new Error('Format data laporan biaya tidak valid.');
      }

      const { saldoAwal, transaksi } = laporan;
      let currentSaldo = parseFloat(saldoAwal) || 0;

      // Recalculate the final balance by iterating through all transactions
      transaksi.forEach(trx => {
        const totalAngka = parseFloat(trx.total) || 0;
        if (trx.jenis === 'Penambah') {
          currentSaldo += totalAngka;
        } else { // Pengurang or Pindahan
          currentSaldo -= totalAngka;
        }
      });

      // Update the dashboard card's innerHTML with the formatted balance
      this.saldoBiayaElement.innerHTML = this._formatRupiah(currentSaldo, 'saldo');

    } catch (error) {
      console.error("Error loading Saldo Biaya for dashboard:", error);
      // Use notification service if available
      if (this.notification) {
          this.notification.show('Gagal memuat Saldo Biaya', 'error');
      }
      // Display error state in the card
      this.saldoBiayaElement.innerHTML = '<span class="text-danger">Error</span>';
    }
  }
  // ================== AKHIR FUNGSI BARU ==================


  // Method pribadi untuk mengambil data statistik (Adapt or remove if not needed)
  async _fetchStats() {
    // This function might need adjustment if other cards are real
    // Or remove it entirely if Paid/Unpaid/Sent Invoices are also placeholders
    try {
      const data = await this.api.get('/api/dashboard/stats');
      // this.totalInvoicesEl.innerText = data.totalInvoices; // Removed
      if (this.paidInvoicesEl) this.paidInvoicesEl.innerText = data.paidInvoices;
      if (this.unpaidInvoicesEl) this.unpaidInvoicesEl.innerText = data.unpaidInvoices;
      if (this.totalSentEl) this.totalSentEl.innerText = data.totalSent;
    } catch (error) {
      console.error('Gagal mengambil data stats:', error);
    }
  }

  // Method pribadi untuk mengambil data wallet (Keep as is)
  async _fetchWallet() {
     if (!this.walletBalanceEl || !this.walletChangeEl) return; // Add checks
    try {
      const data = await this.api.get('/api/dashboard/wallet');
      this.walletBalanceEl.innerText = this._formatCurrency(data.balance); // Assuming this format is different
      this.walletChangeEl.innerText = data.lastChange;
    } catch (error) {
      console.error('Gagal mengambil data wallet:', error);
       this.walletBalanceEl.innerText = '$ Error'; // Show error in UI
    }
  }
  
  // Helper pribadi untuk format mata uang wallet (Keep as is)
  _formatCurrency(amount) {
     if (isNaN(Number(amount))) return '$?.??'; // Handle potential NaN
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}