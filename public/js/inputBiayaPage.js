// public/js/inputBiayaPage.js
import Choices from 'https://esm.sh/choices.js';

export class InputBiayaPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // ===== KOSONGKAN CONSTRUCTOR DARI ELEMEN DOM =====
    this.editingId = null;
    this.kodeBiayaMap = new Map();
    
    this.form = null;
    this.tableBody = null;
    this.kodeBiayaSelect = null;
  }

  async init() {
    // ===== PERBAIKAN 1: CARI ELEMEN KUNCI DI SINI =====
    this.form = document.getElementById('form-input-biaya');
    this.tableBody = document.getElementById('tabel-input-biaya-body');
    this.kodeBiayaSelect = document.getElementById('input-biaya-kode');

    // ===== PERBAIKAN 2: "PENJAGA" ANTI-CRASH =====
    // Jika salah satu elemen kunci tidak ada (kita di halaman lain),
    // hentikan fungsi ini agar tidak crash.
    if (!this.form || !this.tableBody || !this.kodeBiayaSelect) {
      return; 
    }
    
    // Jika semua elemen kunci ditemukan, lanjutkan mencari elemen sisa
    this.formTitle = document.getElementById('form-input-biaya-title');
    this.tanggalInput = document.getElementById('input-biaya-tanggal');
    this.totalInput = document.getElementById('input-biaya-total');
    this.keteranganInput = document.getElementById('input-biaya-keterangan');
    this.batalBtn = this.form.querySelector('.btn-batal');
    this.simpanBtn = this.form.querySelector('.btn-simpan');

    // Inisialisasi Choices.js (sekarang aman)
    this.choicesBiaya = new Choices(this.kodeBiayaSelect, {
      searchEnabled: true,
      itemSelectText: 'Pilih',
      placeholder: true,
      placeholderValue: '-- Pilih Kode Biaya --',
    });
    
    // ===== PERBAIKAN 3: "KODE TIDAK DIKENAL" =====
    await this._populateDropdown(); // Tunggu (await) sampai dropdown & map selesai
    this._loadTable(); // Baru muat tabel
    this._setupEventListeners();
    this._setDefaultDate();
  }

  async _populateDropdown() {
    try {
      const kodeBiayaData = await this.api.get('/api/kodebiaya');
      const formattedData = kodeBiayaData.map(item => {
        this.kodeBiayaMap.set(item.kode, item.uraian);
        return {
          value: item.kode,
          label: `${item.kode} - ${item.uraian}`
        };
      });
      this.choicesBiaya.setChoices(formattedData, 'value', 'label', true);
    } catch (error) {
      this.notification.show('Gagal memuat data master Kode Biaya', 'error');
    }
  }

  _setupEventListeners() {
    // Aman karena init() sudah memeriksa elemen
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
    this.choicesBiaya.clearInput();
    this.choicesBiaya.setChoiceByValue('');
    this._setDefaultDate();
    
    this.editingId = null;
    this.simpanBtn.innerText = 'Simpan Transaksi';
    this.formTitle.innerText = 'Formulir Input Biaya';
    this.form.parentElement.classList.remove('editing');
  }

  async _loadTable() {
    try {
      const transaksiData = await this.api.get('/api/transaksibiaya');
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
    const uraian = this.kodeBiayaMap.get(trx.kodeBiaya) || 'Kode Tidak Dikenal';
    const tanggal = new Date(trx.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    row.innerHTML = `
      <td>${tanggal}</td>
      <td>${trx.kodeBiaya} - ${uraian}</td>
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
      const trx = await this.api.get(`/api/transaksibiaya/${id}`);
      const tgl = new Date(trx.tanggal).toISOString().split('T')[0];
      
      this.tanggalInput.value = tgl;
      this.totalInput.value = trx.total;
      this.keteranganInput.value = trx.keterangan;
      this.choicesBiaya.setChoiceByValue(trx.kodeBiaya);
      
      this.editingId = id;
      this.simpanBtn.innerText = 'Update Transaksi';
      this.formTitle.innerText = 'Edit Transaksi Biaya';
      this.form.parentElement.classList.add('editing');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.notification.show('Gagal mengambil data untuk diedit', 'error');
    }
  }
  
  async _handleDelete(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    
    try {
      await this.api.delete(`/api/transaksibiaya/${id}`);
      this.notification.show('Transaksi berhasil dihapus', 'success');
      await this._loadTable();
      this._resetForm();
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
  
  async _handleSubmit() {
    const data = {
      kodeBiaya: this.kodeBiayaSelect.value,
      tanggal: this.tanggalInput.value,
      total: this.totalInput.value,
      keterangan: this.keteranganInput.value
    };

    if (!data.kodeBiaya) {
      this.notification.show('Kode Biaya harus dipilih', 'error');
      return;
    }

    try {
      if (this.editingId) {
        await this.api.put(`/api/transaksibiaya/${this.editingId}`, data);
        this.notification.show('Transaksi biaya berhasil di-update!', 'success');
      } else {
        await this.api.post('/api/transaksibiaya', data);
        this.notification.show('Transaksi biaya berhasil disimpan!', 'success');
      }
      this._resetForm();
      await this._loadTable();
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}