// public/js/kodeBiayaPage.js

export class KodeBiayaPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;

    // Kosongkan constructor
    this.editingId = null;
    this.form = null;
    this.formTitle = null;
    this.kodeInput = null;
    this.uraianInput = null;
    this.jenisSelect = null;
    this.tableBody = null;
    this.batalBtn = null;
    this.simpanBtn = null;
    this._listenersAttached = false; // Flag listener
  }

  init() {
    // Cari elemen di sini
    this.form = document.getElementById('form-kode-biaya');
    this.tableBody = document.getElementById('tabel-kode-biaya-body');
    this.kodeInput = document.getElementById('kode-biaya-kode');

    // Penjaga anti-crash
    if (!this.form || !this.tableBody || !this.kodeInput) {
      // console.log("KodeBiayaPage: Elemen tidak ditemukan, init() dihentikan."); // Aktifkan jika perlu debug
      return;
    }

    // Lanjutkan cari elemen lain
    this.formTitle = document.getElementById('form-kode-biaya-title');
    this.uraianInput = document.getElementById('kode-biaya-uraian');
    this.jenisSelect = document.getElementById('kode-biaya-jenis');
    this.batalBtn = this.form.querySelector('.btn-batal');
    this.simpanBtn = this.form.querySelector('.btn-simpan');

    this._setupEventListeners();
    this._loadTable();
    // console.log("KodeBiayaPage: init() selesai."); // Aktifkan jika perlu debug
  }

  _setupEventListeners() {
    // Pastikan listener hanya ditambahkan sekali
    if (this._listenersAttached) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      // console.log("Form KodeBiaya submit triggered."); // Aktifkan jika perlu debug
      this._handleSubmit();
    });

    this.batalBtn.addEventListener('click', () => {
        // console.log("Tombol Batal KodeBiaya diklik."); // Aktifkan jika perlu debug
        this._resetForm()
    });

    this.tableBody.addEventListener('click', (e) => {
      // console.log('Klik terdeteksi di tableBody KodeBiaya. Target:', e.target); // Aktifkan jika perlu debug
      const editButton = e.target.closest('.action-btn.edit');
      const deleteButton = e.target.closest('.action-btn.delete');

      if (editButton) {
        const id = editButton.getAttribute('data-id');
        // console.log('Tombol Edit KodeBiaya diklik. ID:', id); // Aktifkan jika perlu debug
        if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-id')) this._handleEditClick(id);
        else console.error('Tombol Edit KodeBiaya tidak memiliki data-id valid.');
      } else if (deleteButton) {
        const id = deleteButton.getAttribute('data-id');
        // console.log('Tombol Delete KodeBiaya diklik. ID:', id); // Aktifkan jika perlu debug
        if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-id')) this._handleDelete(id);
        else console.error('Tombol Delete KodeBiaya tidak memiliki data-id valid.');
      }
    });

    this._listenersAttached = true;
    // console.log("KodeBiayaPage: Event listeners ditambahkan."); // Aktifkan jika perlu debug
  }

  async _loadTable() {
    // console.log("Memulai _loadTable KodeBiaya..."); // Aktifkan jika perlu debug
    try {
      const data = await this.api.get('/api/kodebiaya');
      // Pastikan tableBody masih ada
      if (!this.tableBody) return;
      this.tableBody.innerHTML = '';
      if (data && Array.isArray(data)) {
        data.forEach(item => this.tableBody.appendChild(this._createRow(item)));
        // console.log(`Tabel KodeBiaya dimuat dengan ${data.length} item.`); // Aktifkan jika perlu debug
      } else {
         console.warn("_loadTable KodeBiaya: Data tidak valid atau kosong.", data);
      }
    } catch (error) {
      console.error("Error di _loadTable KodeBiaya:", error);
      this.notification.show('Gagal memuat data kode biaya', 'error');
       if (this.tableBody) { // Cek lagi sebelum modifikasi DOM
           this.tableBody.innerHTML = '<tr><td colspan="4">Gagal memuat data.</td></tr>'; // Sesuaikan colspan
      }
    }
  }

  _createRow(item) {
    const row = document.createElement('tr');
    const itemId = item && item.id ? item.id : `invalid-id-${Math.random()}`;
    if (!item || !item.id) { console.warn("Membuat baris KodeBiaya tanpa ID valid:", item); }

    row.innerHTML = `
      <td>${item?.kode ?? '-'}</td>
      <td>${item?.uraian ?? '-'}</td>
      <td>${item?.jenis ?? '-'}</td>
      <td>
        <button class="action-btn edit" data-id="${itemId}">✏️</button>
        <button class="action-btn delete" data-id="${itemId}">🗑️</button>
      </td>
    `;
    return row;
  }

  _resetForm() {
    // console.log("Mereset form KodeBiaya."); // Aktifkan jika perlu debug
    if (this.form) this.form.reset();
    this.editingId = null;
    if (this.simpanBtn) this.simpanBtn.innerText = 'Simpan';
    if (this.formTitle) this.formTitle.innerText = 'Formulir Input Kode Biaya';
    if (this.kodeInput) this.kodeInput.disabled = false;
    const formContainer = this.form ? this.form.closest('.form-container') : null;
    if (formContainer) formContainer.classList.remove('editing');
  }

  async _handleEditClick(id) {
     // console.log(`Memulai _handleEditClick KodeBiaya untuk ID: ${id}`); // Aktifkan jika perlu debug
    try {
      const item = await this.api.get(`/api/kodebiaya/${id}`);
      // console.log("Data KodeBiaya untuk edit diterima:", item); // Aktifkan jika perlu debug

      if (this.kodeInput) this.kodeInput.value = item.kode;
      if (this.uraianInput) this.uraianInput.value = item.uraian;
      if (this.jenisSelect) this.jenisSelect.value = item.jenis;

      if (this.kodeInput) this.kodeInput.disabled = true;
      this.editingId = item.id;
      if (this.simpanBtn) this.simpanBtn.innerText = 'Update';
      if (this.formTitle) this.formTitle.innerText = 'Edit Kode Biaya';

      const formContainer = this.form ? this.form.closest('.form-container') : null;
      if (formContainer) formContainer.classList.add('editing');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
       console.error(`Error di _handleEditClick KodeBiaya untuk ID ${id}:`, error);
      this.notification.show('Gagal mengambil data untuk diedit', 'error');
    }
  }

  async _handleDelete(id) {
    // console.log(`Memulai _handleDelete KodeBiaya untuk ID: ${id}`); // Aktifkan jika perlu debug
    if (!confirm(`Apakah Anda yakin ingin menghapus kode biaya dengan ID: ${id}?`)) {
        // console.log("Penghapusan KodeBiaya dibatalkan."); // Aktifkan jika perlu debug
        return;
    }

    try {
      await this.api.delete(`/api/kodebiaya/${id}`);
      this.notification.show('Kode biaya berhasil dihapus', 'success');
      // console.log(`Kode biaya ID ${id} berhasil dihapus.`); // Aktifkan jika perlu debug

      if (String(this.editingId) === String(id)) {
          // console.log(`Item KodeBiaya (${id}) sedang diedit. Mereset form.`); // Aktifkan jika perlu debug
          this._resetForm();
      }

      await this._loadTable();
    } catch (error) {
      console.error(`Error di _handleDelete KodeBiaya untuk ID ${id}:`, error);
      this.notification.show(`Error: ${error.message || 'Gagal menghapus data'}`, 'error');
    }
  }

  async _handleSubmit() {
     // console.log("Memulai _handleSubmit KodeBiaya. Mode edit:", this.editingId); // Aktifkan jika perlu debug
    const data = {
      kode: this.kodeInput ? this.kodeInput.value : '',
      uraian: this.uraianInput ? this.uraianInput.value : '',
      jenis: this.jenisSelect ? this.jenisSelect.value : ''
    };

    if (!data.kode || !data.uraian || !data.jenis) {
      console.warn("Submit KodeBiaya dibatalkan: Field kosong.", data);
      this.notification.show('Semua field harus diisi', 'error');
      return;
    }

    try {
      let message = '';
      let isNew = false;
      if (this.editingId) {
        // console.log(`Mengirim PUT request ke /api/kodebiaya/${this.editingId}`); // Aktifkan jika perlu debug
        await this.api.put(`/api/kodebiaya/${this.editingId}`, data);
        message = 'Kode biaya berhasil di-update!';
      } else {
        // console.log("Mengirim POST request ke /api/kodebiaya"); // Aktifkan jika perlu debug
        await this.api.post('/api/kodebiaya', data);
        message = 'Kode biaya berhasil disimpan!';
        isNew = true;
      }
      this.notification.show(message, 'success');
      // console.log("Submit KodeBiaya berhasil:", message); // Aktifkan jika perlu debug

      // ===== Set localStorage jika data BARU =====
      if (isNew) {
        console.log("Setting localStorage: kodeBiayaUpdated = true"); // Tetap log ini
        localStorage.setItem('kodeBiayaUpdated', 'true');
      }
      // ============================================

      this._resetForm();
      await this._loadTable();
    } catch (error) {
      console.error("Error saat submit KodeBiaya:", error);
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}