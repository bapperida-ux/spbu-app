// public/js/inputKasPage.js
import Choices from 'https://esm.sh/choices.js';

export class InputKasPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // Mengosongkan constructor dari elemen DOM
    this.editingId = null;
    this.kodeKasMap = new Map(); 
    
    this.form = null;
    this.tableBody = null;
    this.kodeKasSelect = null;
    // (variabel lain akan diisi di init)
  }

  async init() {
    // ===== PERBAIKAN 1: CARI ELEMEN KUNCI =====
    this.form = document.getElementById('form-input-kas');
    this.tableBody = document.getElementById('tabel-input-kas-body');
    this.kodeKasSelect = document.getElementById('input-kas-kode');

    // ===== PERBAIKAN 2: "PENJAGA" LEBIH KUAT =====
    // Jika salah satu elemen kunci tidak ada (kita di halaman lain ATAU ada typo HTML), 
    // hentikan fungsi ini agar tidak crash.
    if (!this.form || !this.tableBody || !this.kodeKasSelect) {
      // Tidak perlu console.error, karena ini normal terjadi di halaman lain
      return; 
    }
    
    // Jika semua elemen kunci ditemukan, lanjutkan mencari elemen sisa
    this.formTitle = document.getElementById('form-input-kas-title');
    this.tanggalInput = document.getElementById('input-kas-tanggal');
    this.totalInput = document.getElementById('input-kas-total');
    this.keteranganInput = document.getElementById('input-kas-keterangan');
    this.batalBtn = this.form.querySelector('.btn-batal');
    this.simpanBtn = this.form.querySelector('.btn-simpan');

    // Inisialisasi Choices.js (sekarang aman)
    this.choicesKas = new Choices(this.kodeKasSelect, {
      searchEnabled: true,
      itemSelectText: 'Pilih',
      placeholder: true,
      placeholderValue: '-- Pilih Kode Kas --',
    });
    
    // Ini perbaikan untuk "Kode Tidak Dikenal"
    await this._populateDropdown(); // Tunggu sampai dropdown & map selesai
    this._loadTable(); // Baru muat tabel
    this._setupEventListeners();
    this._setDefaultDate();
  }

  async _populateDropdown() {
    try {
      const kodeKasData = await this.api.get('/api/kodekas');
      const formattedData = kodeKasData.map(item => {
        this.kodeKasMap.set(item.kode, item.uraian); 
        return {
          value: item.kode,
          label: `${item.kode} - ${item.uraian}`
        };
      });
      this.choicesKas.setChoices(formattedData, 'value', 'label', true);
    } catch (error) {
      this.notification.show('Gagal memuat data master Kode Kas', 'error');
    }
  }

  _setupEventListeners() {
    // Fungsi ini sekarang aman karena init() sudah memeriksa 
    // bahwa this.form dan this.tableBody tidak null
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });
    
    this.batalBtn.addEventListener('click', () => this._resetForm());
    
    this.tableBody.addEventListener('click', async (e) => {
      const editButton = e.target.closest('.action-btn.edit');
      const deleteButton = e.target.closest('.action-btn.delete');

      if (editButton) {
        const id = editButton.getAttribute('data-id');
        await this._handleEditClick(id);
      } else if (deleteButton) {
        const id = deleteButton.getAttribute('data-id');
        await this._handleDelete(id);
      }
    });
  }
  
  _setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    this.tanggalInput.value = today;
  }

  _resetForm() {
    this.form.reset();
    this.choicesKas.clearInput();
    this.choicesKas.setChoiceByValue('');
    this._setDefaultDate();
    
    this.editingId = null;
    this.simpanBtn.innerText = 'Simpan Transaksi';
    this.formTitle.innerText = 'Formulir Input Kas';
    this.form.parentElement.classList.remove('editing');
  }

  async _loadTable() {
    try {
      const transaksiData = await this.api.get('/api/transaksikas');
      this.tableBody.innerHTML = ''; 
      
      for (const trx of transaksiData) {
        this.tableBody.appendChild(this._createRow(trx));
      }
    } catch (error) {
      this.notification.show('Gagal memuat data transaksi', 'error');
    }
  }
  
  _createRow(trx) {
    const row = document.createElement('tr');
    const uraian = this.kodeKasMap.get(trx.kodeKas) || 'Kode Tidak Dikenal';
    const tanggal = new Date(trx.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    row.innerHTML = `
      <td>${tanggal}</td>
      <td>${trx.kodeKas} - ${uraian}</td>
      <td>${trx.keterangan || ''}</td>
      <td>${trx.total.toLocaleString('id-ID')}</td>
      <td>
        <button class="action-btn edit" data-id="${trx.id}">✏️</button>
        <button class="action-btn delete" data-id="${trx.id}">🗑️</button>
      </td>
    `;
    return row;
  }
  
  async _handleEditClick(id) {
    try {
      const trx = await this.api.get(`/api/transaksikas/${id}`);
      const tgl = new Date(trx.tanggal).toISOString().split('T')[0];
      
      this.tanggalInput.value = tgl;
      this.totalInput.value = trx.total;
      this.keteranganInput.value = trx.keterangan;
      this.choicesKas.setChoiceByValue(trx.kodeKas); 
      
      this.editingId = id;
      this.simpanBtn.innerText = 'Update Transaksi';
      this.formTitle.innerText = 'Edit Transaksi Kas';
      this.form.parentElement.classList.add('editing');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.notification.show('Gagal mengambil data untuk diedit', 'error');
    }
  }
  
  async _handleDelete(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    
    try {
      await this.api.delete(`/api/transaksikas/${id}`);
      this.notification.show('Transaksi berhasil dihapus', 'success');
      await this._loadTable();
      this._resetForm();
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
  
  async _handleSubmit() {
    const data = {
      kodeKas: this.kodeKasSelect.value,
      tanggal: this.tanggalInput.value,
      total: this.totalInput.value,
      keterangan: this.keteranganInput.value
    };

    if (!data.kodeKas) {
      this.notification.show('Kode Kas harus dipilih', 'error');
      return;
    }

    try {
      if (this.editingId) {
        await this.api.put(`/api/transaksikas/${this.editingId}`, data);
        this.notification.show('Transaksi kas berhasil di-update!', 'success');
      } else {
        await this.api.post('/api/transaksikas', data);
        this.notification.show('Transaksi kas berhasil disimpan!', 'success');
      }
      this._resetForm();
      await this._loadTable();
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}