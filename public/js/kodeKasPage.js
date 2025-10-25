// public/js/kodeKasPage.js

export class KodeKasPage {
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
    this.form = document.getElementById('form-kode-kas');
    this.tableBody = document.getElementById('tabel-kode-kas-body');
    this.kodeInput = document.getElementById('kode-kas-kode');

    // Penjaga anti-crash
    if (!this.form || !this.tableBody || !this.kodeInput) {
      // console.log("KodeKasPage: Elemen tidak ditemukan, init() dihentikan."); // Aktifkan jika perlu debug
      return;
    }

    // Lanjutkan cari elemen lain
    this.formTitle = document.getElementById('form-kode-kas-title');
    this.uraianInput = document.getElementById('kode-kas-uraian');
    this.jenisSelect = document.getElementById('kode-kas-jenis');
    this.batalBtn = this.form.querySelector('.btn-batal');
    this.simpanBtn = this.form.querySelector('.btn-simpan');

    this._setupEventListeners();
    this._loadTable();
    // console.log("KodeKasPage: init() selesai."); // Aktifkan jika perlu debug
  }

  _setupEventListeners() {
    // Pastikan listener hanya ditambahkan sekali
    if (this._listenersAttached) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    this.batalBtn.addEventListener('click', () => this._resetForm());

    this.tableBody.addEventListener('click', (e) => {
      // console.log('Klik terdeteksi di tableBody KodeKas. Target:', e.target); // Aktifkan jika perlu debug
      const editButton = e.target.closest('.action-btn.edit');
      const deleteButton = e.target.closest('.action-btn.delete');

      if (editButton) {
        const id = editButton.getAttribute('data-id');
        // console.log('Tombol Edit KodeKas diklik. ID:', id); // Aktifkan jika perlu debug
        if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-id')) this._handleEditClick(id);
        else console.error('Tombol Edit KodeKas tidak memiliki data-id valid.');
      } else if (deleteButton) {
        const id = deleteButton.getAttribute('data-id');
        // console.log('Tombol Delete KodeKas diklik. ID:', id); // Aktifkan jika perlu debug
        if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-id')) this._handleDelete(id);
        else console.error('Tombol Delete KodeKas tidak memiliki data-id valid.');
      }
    });

    this._listenersAttached = true;
    // console.log("KodeKasPage: Event listeners ditambahkan."); // Aktifkan jika perlu debug
  }

  async _loadTable() {
    // console.log("Memulai _loadTable KodeKas..."); // Aktifkan jika perlu debug
    try {
      const data = await this.api.get('/api/kodekas');
      // Pastikan tableBody masih ada (antisipasi navigasi cepat)
      if (!this.tableBody) return;
      this.tableBody.innerHTML = '';
      if (data && Array.isArray(data)) {
        data.forEach(item => this.tableBody.appendChild(this._createRow(item)));
        // console.log(`Tabel KodeKas dimuat dengan ${data.length} item.`); // Aktifkan jika perlu debug
      } else {
         console.warn("_loadTable KodeKas: Data tidak valid atau kosong.", data);
      }
    } catch (error) {
      console.error("Error di _loadTable KodeKas:", error);
      this.notification.show('Gagal memuat data kode kas', 'error');
      if (this.tableBody) { // Cek lagi sebelum modifikasi DOM
           this.tableBody.innerHTML = '<tr><td colspan="4">Gagal memuat data.</td></tr>'; // Sesuaikan colspan
      }
    }
  }

  _createRow(item) {
    const row = document.createElement('tr');
    // Beri ID unik jika item.id tidak ada, tapi beri log warning
    const itemId = item && item.id ? item.id : `invalid-id-${Math.random()}`;
    if (!item || !item.id) { console.warn("Membuat baris KodeKas tanpa ID valid:", item); }

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
    // console.log("Mereset form KodeKas."); // Aktifkan jika perlu debug
    // Tambahkan pengecekan null sebelum akses properti
    if (this.form) this.form.reset();
    this.editingId = null;
    if (this.simpanBtn) this.simpanBtn.innerText = 'Simpan';
    if (this.formTitle) this.formTitle.innerText = 'Formulir Input Kode Kas';
    if (this.kodeInput) this.kodeInput.disabled = false;
    const formContainer = this.form ? this.form.closest('.form-container') : null;
    if (formContainer) formContainer.classList.remove('editing');
  }

  async _handleEditClick(id) {
     // console.log(`Memulai _handleEditClick KodeKas untuk ID: ${id}`); // Aktifkan jika perlu debug
    try {
      const item = await this.api.get(`/api/kodekas/${id}`);
      // console.log("Data KodeKas untuk edit diterima:", item); // Aktifkan jika perlu debug

      // Tambahkan pengecekan null
      if (this.kodeInput) this.kodeInput.value = item.kode;
      if (this.uraianInput) this.uraianInput.value = item.uraian;
      if (this.jenisSelect) this.jenisSelect.value = item.jenis;

      if (this.kodeInput) this.kodeInput.disabled = true;
      this.editingId = item.id;
      if (this.simpanBtn) this.simpanBtn.innerText = 'Update';
      if (this.formTitle) this.formTitle.innerText = 'Edit Kode Kas';

      const formContainer = this.form ? this.form.closest('.form-container') : null;
      if (formContainer) formContainer.classList.add('editing');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
       console.error(`Error di _handleEditClick KodeKas untuk ID ${id}:`, error);
      this.notification.show('Gagal mengambil data untuk diedit', 'error');
    }
  }

  async _handleDelete(id) {
    // console.log(`Memulai _handleDelete KodeKas untuk ID: ${id}`); // Aktifkan jika perlu debug
    if (!confirm(`Apakah Anda yakin ingin menghapus kode kas dengan ID: ${id}?`)) {
        // console.log("Penghapusan KodeKas dibatalkan."); // Aktifkan jika perlu debug
        return;
    }

    try {
      await this.api.delete(`/api/kodekas/${id}`);
      this.notification.show('Kode kas berhasil dihapus', 'success');
      // console.log(`Kode kas ID ${id} berhasil dihapus.`); // Aktifkan jika perlu debug

      if (String(this.editingId) === String(id)) {
          // console.log(`Item KodeKas (${id}) sedang diedit. Mereset form.`); // Aktifkan jika perlu debug
          this._resetForm();
      }

      await this._loadTable();
    } catch (error) {
      console.error(`Error di _handleDelete KodeKas untuk ID ${id}:`, error);
      this.notification.show(`Error: ${error.message || 'Gagal menghapus data'}`, 'error');
    }
  }

  async _handleSubmit() {
     // console.log("Memulai _handleSubmit KodeKas. Mode edit:", this.editingId); // Aktifkan jika perlu debug
    // Tambahkan pengecekan null
    const data = {
      kode: this.kodeInput ? this.kodeInput.value : '',
      uraian: this.uraianInput ? this.uraianInput.value : '',
      jenis: this.jenisSelect ? this.jenisSelect.value : ''
    };

    if (!data.kode || !data.uraian || !data.jenis) {
      console.warn("Submit KodeKas dibatalkan: Field kosong.", data);
      this.notification.show('Semua field harus diisi', 'error');
      return;
    }

    try {
      let message = '';
      let isNew = false; // Tandai jika ini data baru
      if (this.editingId) {
        // console.log(`Mengirim PUT request ke /api/kodekas/${this.editingId}`); // Aktifkan jika perlu debug
        await this.api.put(`/api/kodekas/${this.editingId}`, data);
        message = 'Kode kas berhasil di-update!';
      } else {
        // console.log("Mengirim POST request ke /api/kodekas"); // Aktifkan jika perlu debug
        await this.api.post('/api/kodekas', data);
        message = 'Kode kas berhasil disimpan!';
        isNew = true; // Ini data baru
      }
      this.notification.show(message, 'success');
      // console.log("Submit KodeKas berhasil:", message); // Aktifkan jika perlu debug

      // ===== Set localStorage jika data BARU =====
      if (isNew) {
        console.log("Setting localStorage: kodeKasUpdated = true"); // Tetap log ini
        localStorage.setItem('kodeKasUpdated', 'true');
      }
      // ============================================

      this._resetForm();
      await this._loadTable();
    } catch (error) {
      console.error("Error saat submit KodeKas:", error);
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}