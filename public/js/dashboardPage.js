// public/js/dashboardPage.js

// Class ini hanya bertanggung jawab untuk halaman Dashboard
export class DashboardPage {
  constructor(apiService) {
    this.api = apiService; // Diberi "Kurir" (ApiService)
    
    // Ambil semua elemen DOM yang dibutuhkan oleh dashboard
    this.totalInvoicesEl = document.getElementById('total-invoices');
    this.paidInvoicesEl = document.getElementById('paid-invoices');
    this.unpaidInvoicesEl = document.getElementById('unpaid-invoices');
    this.totalSentEl = document.getElementById('total-sent');
    this.walletBalanceEl = document.getElementById('wallet-balance');
    this.walletChangeEl = document.getElementById('wallet-change');
  }

  // Fungsi inisialisasi utama (dipanggil oleh app.js)
  init() {
    this._fetchStats();
    this._fetchWallet();
  }

  // Method pribadi untuk mengambil data statistik
  async _fetchStats() {
    try {
      const data = await this.api.get('/api/dashboard/stats');
      this.totalInvoicesEl.innerText = data.totalInvoices;
      this.paidInvoicesEl.innerText = data.paidInvoices;
      this.unpaidInvoicesEl.innerText = data.unpaidInvoices;
      this.totalSentEl.innerText = data.totalSent;
    } catch (error) {
      console.error('Gagal mengambil data stats:', error);
    }
  }

  // Method pribadi untuk mengambil data wallet
  async _fetchWallet() {
    try {
      const data = await this.api.get('/api/dashboard/wallet');
      this.walletBalanceEl.innerText = this._formatCurrency(data.balance);
      this.walletChangeEl.innerText = data.lastChange;
    } catch (error) {
      console.error('Gagal mengambil data wallet:', error);
    }
  }
  
  // Helper pribadi untuk format mata uang
  _formatCurrency(amount) {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}