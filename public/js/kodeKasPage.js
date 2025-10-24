// public/js/kodeKasPage.js

export class KodeKasPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;
    
    // Ambil elemen container dan judul
    this.formContainer = document.querySelector('#input-kode-kas .form-container'); 
    this.form = document.getElementById('form-kode-kas');
    this.formTitle = this.formContainer.querySelector('h3'); // Ambil <h3>
    
    this.kodeInput = document.getElementById('kode-kas-kode');
    this.uraianInput = document.getElementById('kode-kas-uraian');
    this.jenisInput = document.getElementById('kode-kas-jenis');
    this.simpanBtn = this.form.querySelector('.btn-simpan');
    this.batalBtn = this.form.querySelector('.btn-batal');
    
    this.tableBody = document.getElementById('tabel-kode-kas-body');
    
    this.editingId = null;
    this.originalTitle = this.formTitle.innerText; // Simpan judul asli
  }

  init() {
    this._loadTable();
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Saat formulir disubmit (tombol Simpan/Update)
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmitForm();
    });

    // Saat tombol Batal diklik
    this.batalBtn.addEventListener('click', () => {
      this._resetForm();
    });

    // Menggunakan 'closest()' agar lebih kuat
    this.tableBody.addEventListener('click', async (e) => {
      // Cek tombol edit
      const editButton = e.target.closest('.action-btn.edit');
      if (editButton) {
        e.preventDefault();
        const id = editButton.getAttribute('data-id');
        await this._handleEditClick(id);
        return; // Hentikan eksekusi
      }

      // Cek tombol delete
      const deleteButton = e.target.closest('.action-btn.delete');
      if (deleteButton) {
        e.preventDefault();
        const id = deleteButton.getAttribute('data-id');
        await this._handleDelete(id);
        return;
      }
    });
  }
  
  // Mengosongkan formulir dan mereset state
  _resetForm() {
    this.form.reset();
    this.editingId = null;
    
    this.simpanBtn.innerText = 'Simpan'; // Kembalikan teks tombol
    this.formContainer.classList.remove('editing'); // Hapus class highlight
    this.formTitle.innerText = this.originalTitle; // Kembalikan judul
  }

  // Memuat data tabel
  async _loadTable() {
    try {
      const data = await this.api.get('/api/kodekas');
      this.tableBody.innerHTML = '';
      data.forEach(item => {
        this.tableBody.appendChild(this._createRow(item));
      });
    } catch (error) {
      console.error('Gagal memuat tabel kode kas:', error);
      this.notification.show('Gagal memuat data tabel.', 'error');
    }
  }

  // Dipanggil saat tombol ✏️ diklik
  async _handleEditClick(id) {
    try {
      const data = await this.api.get(`/api/kodekas/${id}`);
      
      this.kodeInput.value = data.kode;
      this.uraianInput.value = data.uraian;
      this.jenisInput.value = data.jenis;
      
      this.editingId = data._id;

      this.simpanBtn.innerText = 'Update';
      this.formContainer.classList.add('editing'); // Tambah class highlight
      this.formTitle.innerText = 'Edit Kode Kas'; // Ubah judul
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }

  // Menangani Simpan (Create) dan Update
  async _handleSubmitForm() {
    const data = {
      kode: this.kodeInput.value,
      uraian: this.uraianInput.value,
      jenis: this.jenisInput.value,
    };

    try {
      if (this.editingId) {
        await this.api.put(`/api/kodekas/${this.editingId}`, data);
        this.notification.show('Data Kode Kas berhasil di-update!', 'success');
      } else {
        await this.api.post('/api/kodekas', data);
        this.notification.show('Data Kode Kas berhasil disimpan!', 'success');
      }
      this._resetForm();
      await this._loadTable();
    } catch (error) {
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }

  async _handleDelete(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return;
    }
    
    try {
      await this.api.delete(`/api/kodekas/${id}`);
      this.notification.show('Data berhasil dihapus.', 'success');
      await this._loadTable();

      // Jika data yg sedang diedit dihapus, reset form
      if (id === this.editingId) {
        this._resetForm();
      }
    } catch (error) {
      this.notification.show(`Gagal menghapus data: ${error.message}`, 'error');
    }
  }

  // Membuat 1 baris <tr>
  _createRow(item) {
    const row = document.createElement('tr');
    const badgeClass = `badge badge-${item.jenis.toLowerCase()}`;
    row.innerHTML = `
      <td>${item.kode}</td>
      <td>${item.uraian}</td>
      <td><span class="${badgeClass}">${item.jenis}</span></td>
      <td>
        <button class="action-btn edit" data-id="${item._id}">✏️</button>
        <button class="action-btn delete" data-id="${item._id}">🗑️</button>
      </td>
    `;
    return row;
  }
}