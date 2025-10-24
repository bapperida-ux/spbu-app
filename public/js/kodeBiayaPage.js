// public/js/kodeBiayaPage.js

export class KodeBiayaPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // ===== KOSONGKAN CONSTRUCTOR (MEMPERBAIKI MENU) =====
    this.editingId = null;
    this.form = null;
    this.formTitle = null;
    this.kodeInput = null;
    this.uraianInput = null;
    this.jenisSelect = null;
    this.tableBody = null;
    this.batalBtn = null;
    this.simpanBtn = null;
  }

  init() {
    // ===== PERBAIKAN 1: "PENJAGA" ANTI-CRASH (MEMPERBAIKI MENU) =====
    this.form = document.getElementById('form-kode-biaya');
    this.tableBody = document.getElementById('tabel-kode-biaya-body');
    this.kodeInput = document.getElementById('kode-biaya-kode'); 

    if (!this.form || !this.tableBody || !this.kodeInput) {
      return; 
    }
    
    this.formTitle = document.getElementById('form-kode-biaya-title'); 
    this.uraianInput = document.getElementById('kode-biaya-uraian');
    this.jenisSelect = document.getElementById('kode-biaya-jenis'); 
    this.batalBtn = this.form.querySelector('.btn-batal');
    this.simpanBtn = this.form.querySelector('.btn-simpan');

    this._setupEventListeners();
    this._loadTable();
  }

  _setupEventListeners() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    this.batalBtn.addEventListener('click', () => this._resetForm());

    this.tableBody.addEventListener('click', (e) => {
      // ===== TAMBAHKAN LOGGING DI SINI =====
      console.log('Klik terdeteksi di tableBody. Target:', e.target);
      // =====================================

      const editButton = e.target.closest('.action-btn.edit');
      const deleteButton = e.target.closest('.action-btn.delete');

      if (editButton) {
        const id = editButton.getAttribute('data-id');
        console.log('Tombol Edit diklik. ID:', id); // Logging
        if (id) {
          this._handleEditClick(id);
        } else {
          console.error('Tombol Edit tidak memiliki data-id yang valid.'); // Logging Error
        }
      } else if (deleteButton) {
        const id = deleteButton.getAttribute('data-id');
        console.log('Tombol Delete diklik. ID:', id); // Logging
        if (id) {
          this._handleDelete(id);
        } else {
          console.error('Tombol Delete tidak memiliki data-id yang valid.'); // Logging Error
        }
      } else {
         console.log('Klik di tableBody, tapi bukan tombol Edit/Delete.'); // Logging
      }
    });
  }

  async _loadTable() {
    try {
      const data = await this.api.get('/api/kodebiaya');
      this.tableBody.innerHTML = '';
      data.forEach(item => {
        this.tableBody.appendChild(this._createRow(item));
      });
    } catch (error) {
      this.notification.show('Gagal memuat data kode biaya', 'error');
    }
  }

  _createRow(item) {
    const row = document.createElement('tr');
    
    // ===== PERBAIKAN 2: GUNAKAN 'item.id' (MySQL) =====
    row.innerHTML = `
      <td>${item.kode}</td>
      <td>${item.uraian}</td>
      <td>${item.jenis}</td>
      <td>
        <button class="action-btn edit" data-id="${item.id}">✏️</button>
        <button class="action-btn delete" data-id="${item.id}">🗑️</button>
      </td>
    `;
    return row;
  }

  _resetForm() {
    this.form.reset();
    this.editingId = null;
    this.simpanBtn.innerText = 'Simpan';
    if (this.formTitle) this.formTitle.innerText = 'Formulir Input Kode Biaya'; 
    this.kodeInput.disabled = false;
    const formContainer = this.form.closest('.form-container'); 
    if (formContainer) {
        formContainer.classList.remove('editing');
    }
  }

  async _handleEditClick(id) {
    try {
      const item = await this.api.get(`/api/kodebiaya/${id}`);
      
      this.kodeInput.value = item.kode;
      this.uraianInput.value = item.uraian;
      this.jenisSelect.value = item.jenis; 
      
      this.kodeInput.disabled = true; 
      this.editingId = item.id;
      this.simpanBtn.innerText = 'Update';
      if (this.formTitle) this.formTitle.innerText = 'Edit Kode Biaya'; 
      
      const formContainer = this.form.closest('.form-container');
      if (formContainer) {
          formContainer.classList.add('editing');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.notification.show('Gagal mengambil data untuk diedit', 'error');
    }
  }

  async _handleDelete(id) {
    // Penjaga ID sudah ada dari event listener
    console.log(`Memulai _handleDelete untuk ID: ${id}`); // Logging
    if (!confirm(`Apakah Anda yakin ingin menghapus kode biaya dengan ID: ${id}?`)) return;
    
    try {
      await this.api.delete(`/api/kodebiaya/${id}`);
      this.notification.show('Kode biaya berhasil dihapus', 'success');
      
      if (String(this.editingId) === String(id)) { // Konversi ke string untuk perbandingan aman
          console.log(`Item yang dihapus (${id}) sedang diedit. Mereset form.`); // Logging
          this._resetForm();
      }
      
      await this._loadTable(); 
    } catch (error) {
      console.error(`Error di _handleDelete untuk ID ${id}:`, error); // Logging Error Detail
      this.notification.show(`Error: ${error.message || 'Gagal menghapus data'}`, 'error');
    }
  }

  async _handleSubmit() {
    const data = {
      kode: this.kodeInput.value,
      uraian: this.uraianInput.value,
      jenis: this.jenisSelect.value 
    };

    if (!data.kode || !data.uraian || !data.jenis) {
      this.notification.show('Semua field harus diisi', 'error');
      return;
    }

    try {
      let message = '';
      if (this.editingId) {
        await this.api.put(`/api/kodebiaya/${this.editingId}`, data);
        message = 'Kode biaya berhasil di-update!';
      } else {
        await this.api.post('/api/kodebiaya', data);
        message = 'Kode biaya berhasil disimpan!';
      }
      this.notification.show(message, 'success'); // Tampilkan notifikasi sukses
      
      this._resetForm(); // Reset form dulu
      await this._loadTable(); // Baru load tabel
    } catch (error) {
      console.error("Error saat submit:", error); // Logging error submit
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}