// public/js/inputBiayaPage.js
import Choices from 'https://esm.sh/choices.js';

export class InputBiayaPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;

    // Kosongkan constructor
    this.editingId = null;
    this.kodeBiayaMap = new Map();
    this.choicesInstance = null; // Simpan instance Choices.js

    this.form = null;
    this.tableBody = null;
    this.kodeBiayaSelect = null;
    this.formTitle = null;
    this.tanggalInput = null;
    this.totalInput = null;
    this.keteranganInput = null;
    this.simpanBtn = null;
    this.batalBtn = null;
    this._formListenersAttached = false; // Flag listener form
  }

  async init() {
    // Cari elemen kunci
    this.form = document.getElementById('form-input-biaya');
    this.tableBody = document.getElementById('tabel-input-biaya-body');
    this.kodeBiayaSelect = document.getElementById('input-biaya-kode');

    // Penjaga anti-crash
    if (!this.form || !this.tableBody || !this.kodeBiayaSelect) {
      // console.log("InputBiayaPage: Elemen tidak ditemukan, init() dihentikan."); // Aktifkan jika perlu debug
      return;
    }

    // Lanjutkan cari elemen sisa
    this.formTitle = document.getElementById('form-input-biaya-title');
    this.tanggalInput = document.getElementById('input-biaya-tanggal');
    this.totalInput = document.getElementById('input-biaya-total');
    this.keteranganInput = document.getElementById('input-biaya-keterangan');
    this.simpanBtn = this.form.querySelector('.btn-simpan');
    this.batalBtn = this.form.querySelector('.btn-batal');

    // Set tanggal default & listener form
    this._setDefaultTanggal();
    this._setupFormEventListeners();

    // Muat dropdown dan tabel awal
    await this._populateDropdown(); // Tunggu dropdown selesai
    await this._loadTable(); // Baru muat tabel

    // Tambahkan listener focus
    this._setupFocusListener();

    // console.log("InputBiayaPage: init() selesai."); // Aktifkan jika perlu debug
  }

  _setDefaultTanggal() {
    if (this.tanggalInput && !this.tanggalInput.value) {
      try {
        this.tanggalInput.value = new Date().toISOString().split('T')[0];
      } catch (e) {
         console.error("Gagal set tanggal default Biaya:", e);
      }
    }
  }

  _setupFormEventListeners() {
    if (this._formListenersAttached) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    this.batalBtn.addEventListener('click', () => this._resetForm());

    this.tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.action-btn.edit');
        const deleteButton = e.target.closest('.action-btn.delete');

        if (editButton) {
            const id = editButton.getAttribute('data-id');
            if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-trx-id')) this._handleEditClick(id);
            else console.error('Tombol Edit InputBiaya tidak memiliki data-id valid.');
        } else if (deleteButton) {
            const id = deleteButton.getAttribute('data-id');
            if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-trx-id')) {
              // ================== EDITAN DI SINI ==================
              this._handleDelete(id, deleteButton);
              // ====================================================
            }
             else console.error('Tombol Delete InputBiaya tidak memiliki data-id valid.');
        }
    });

    this._formListenersAttached = true;
    // console.log("InputBiayaPage: Form listeners ditambahkan."); // Aktifkan jika perlu debug
  }

  _setupFocusListener() {
      // Hanya tambahkan satu kali
      if (window._inputBiayaFocusListenerAttached) return;

      window.addEventListener('focus', async () => {
          // console.log("Window focused - InputBiayaPage"); // Aktifkan jika perlu debug
          // Cek flag di localStorage
          if (localStorage.getItem('kodeBiayaUpdated') === 'true') {
              console.log("Detected kodeBiayaUpdated flag. Refreshing dropdown Biaya..."); // Tetap log ini
              localStorage.removeItem('kodeBiayaUpdated'); // Hapus flag
               // Pastikan elemen select masih ada sebelum memuat ulang
               if(document.getElementById('input-biaya-kode')){
                  await this._populateDropdown(); // Muat ulang dropdown
                  this.notification.show('Daftar Kode Biaya diperbarui.', 'info');
               } else {
                   console.warn("Elemen select Kode Biaya tidak ditemukan saat focus event.");
               }
          }
      });
      window._inputBiayaFocusListenerAttached = true; // Tandai sudah ditambahkan
      // console.log("InputBiayaPage: Focus listener ditambahkan."); // Aktifkan jika perlu debug
  }

  async _populateDropdown() {
    // console.log("Memuat dropdown KodeBiaya..."); // Aktifkan jika perlu debug
     // Pastikan elemen select masih ada
     if (!this.kodeBiayaSelect) {
        console.error("Elemen select Kode Biaya tidak ditemukan saat _populateDropdown.");
        return;
    }
    try {
      const kodeBiayaList = await this.api.get('/api/kodebiaya');
      this.kodeBiayaMap.clear();

      const choicesOptions = [{ value: '', label: 'Pilih Kode Biaya...', selected: true, disabled: true }];

      kodeBiayaList.forEach(kode => {
        this.kodeBiayaMap.set(kode.kode, kode);
        choicesOptions.push({
          value: kode.kode,
          label: `${kode.kode} - ${kode.uraian} (${kode.jenis})`
        });
      });

      // ===== PERBAIKAN: Gunakan setChoices jika instance sudah ada =====
      if (this.choicesInstance) {
        // console.log("Instance Choices.js (Biaya) sudah ada, memperbarui pilihan..."); // Aktifkan jika perlu debug
        this.choicesInstance.setChoices(choicesOptions, 'value', 'label', true);
      } else {
        // console.log("Membuat instance Choices.js (Biaya) baru..."); // Aktifkan jika perlu debug
        this.choicesInstance = new Choices(this.kodeBiayaSelect, {
          choices: choicesOptions,
          searchEnabled: true,
          itemSelectText: 'Tekan enter untuk memilih',
          shouldSort: false,
        });
      }
      // ====================================================================

      // console.log("Dropdown KodeBiaya berhasil dimuat/diperbarui."); // Aktifkan jika perlu debug

    } catch (error) {
      console.error("Error memuat dropdown KodeBiaya:", error);
      this.notification.show('Gagal memuat daftar Kode Biaya', 'error');
      // Jika gagal, reset state Choices.js
      if (this.choicesInstance) {
          this.choicesInstance.destroy();
          this.choicesInstance = null;
      }
       // Pastikan elemen select masih ada sebelum ubah HTML
       if (this.kodeBiayaSelect) {
          this.kodeBiayaSelect.innerHTML = '<option value="">Gagal memuat</option>';
       }
    }
  }

  async _loadTable() {
    // console.log("Memuat tabel InputBiaya..."); // Aktifkan jika perlu debug
     // Pastikan elemen tabel masih ada
    if (!this.tableBody) {
        console.error("Elemen tabel InputBiaya tidak ditemukan saat _loadTable.");
        return;
    }
    try {
      const transactions = await this.api.get('/api/transaksibiaya?limit=10&sort=desc');
      this.tableBody.innerHTML = '';

      if (transactions && Array.isArray(transactions)) {
          transactions.forEach(trx => {
              this.tableBody.appendChild(this._createRow(trx));
          });
          // console.log(`Tabel InputBiaya dimuat dengan ${transactions.length} item.`); // Aktifkan jika perlu debug
      } else {
          console.warn("_loadTable InputBiaya: Data transaksi tidak valid atau kosong.", transactions);
      }
    } catch (error) {
      console.error("Error memuat tabel InputBiaya:", error);
      this.notification.show('Gagal memuat riwayat transaksi biaya', 'error');
      this.tableBody.innerHTML = '<tr><td colspan="7">Gagal memuat riwayat.</td></tr>'; // Sesuaikan colspan
    }
  }

  _formatRupiah(number) {
    if (number === null || number === undefined || isNaN(Number(number))) { return 'Rp 0'; }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(number));
  }

   _formatTanggal(dateString) {
     try {
       const date = new Date(dateString);
       if (isNaN(date.getTime())) { return dateString; }
       return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
     } catch (e) { return dateString; }
  }

  _createRow(trx) {
    const row = document.createElement('tr');
    const kodeDetail = this.kodeBiayaMap.get(trx.kodeBiaya);
    const uraian = kodeDetail ? kodeDetail.uraian : 'Kode tidak ditemukan';
    const jenis = kodeDetail ? kodeDetail.jenis : '-';
    const trxId = trx && trx.id ? trx.id : `invalid-trx-id-${Math.random()}`;
    if (!trx || !trx.id) { console.warn("Membuat baris transaksi Biaya tanpa ID valid:", trx); }

    row.id = `transaksibiaya-row-${trxId}`; // Tambahkan ID ke baris
    row.innerHTML = `
      <td>${this._formatTanggal(trx.tanggal)}</td>
      <td>${trx.kodeBiaya}</td>
      <td>${uraian}</td>
      <td>${jenis}</td>
      <td class="text-right">${this._formatRupiah(trx.total)}</td>
      <td>${trx.keterangan || ''}</td>
      <td>
        <button class="action-btn edit" data-id="${trxId}">✏️</button>
        <button class="action-btn delete" data-id="${trxId}">🗑️</button>
      </td>
    `;
    return row;
  }

   _resetForm() {
    // console.log("Mereset form InputBiaya."); // Aktifkan jika perlu debug
    if (this.form) this.form.reset();
    this.editingId = null;
    if (this.simpanBtn) this.simpanBtn.innerText = 'Simpan';
    if (this.formTitle) this.formTitle.innerText = 'Formulir Input Biaya';
    this._setDefaultTanggal();
    if(this.choicesInstance) {
         try {
            this.choicesInstance.clearStore();
            this.choicesInstance.setChoices([{ value: '', label: 'Pilih Kode Biaya...', selected: true, disabled: true }], 'value', 'label', true);
            this.choicesInstance.clearInput();
        } catch (e) {
            console.error("Gagal mereset Choices.js (Biaya):", e);
            if (this.kodeBiayaSelect) this.kodeBiayaSelect.value = '';
        }
    } else if (this.kodeBiayaSelect) {
        this.kodeBiayaSelect.value = '';
    }
    const formContainer = this.form ? this.form.closest('.form-container') : null;
    if (formContainer) formContainer.classList.remove('editing');
  }

  async _handleEditClick(id) {
    // console.log(`Memulai _handleEditClick InputBiaya untuk ID: ${id}`); // Aktifkan jika perlu debug
    try {
      const trx = await this.api.get(`/api/transaksibiaya/${id}`);
      // console.log("Data TransaksiBiaya untuk edit diterima:", trx); // Aktifkan jika perlu debug

      if (this.tanggalInput) this.tanggalInput.value = trx.tanggal ? trx.tanggal.split('T')[0] : '';
      if (this.totalInput) this.totalInput.value = trx.total ?? '';
      if (this.keteranganInput) this.keteranganInput.value = trx.keterangan ?? '';
      if (this.choicesInstance) { this.choicesInstance.setChoiceByValue(String(trx.kodeBiaya ?? '')); }
      else if (this.kodeBiayaSelect) { this.kodeBiayaSelect.value = trx.kodeBiaya ?? ''; }

      this.editingId = trx.id;
      if (this.simpanBtn) this.simpanBtn.innerText = 'Update';
      if (this.formTitle) this.formTitle.innerText = 'Edit Transaksi Biaya';

      const formContainer = this.form ? this.form.closest('.form-container') : null;
      if (formContainer) formContainer.classList.add('editing');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
       console.error(`Error di _handleEditClick InputBiaya untuk ID ${id}:`, error);
      this.notification.show('Gagal mengambil data transaksi untuk diedit', 'error');
    }
  }

  // ================== EDITAN DI SINI ==================
  async _handleDelete(id, deleteButtonElement) {
  // ====================================================
    // console.log(`Memulai _handleDelete InputBiaya untuk ID: ${id}`); // Aktifkan jika perlu debug
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi biaya ini?')) {
        // console.log("Penghapusan TransaksiBiaya dibatalkan."); // Aktifkan jika perlu debug
        return;
    }
    try {
      await this.api.delete(`/api/transaksibiaya/${id}`);
      this.notification.show('Transaksi biaya berhasil dihapus', 'success');
      // console.log(`Transaksi biaya ID ${id} berhasil dihapus.`); // Aktifkan jika perlu debug
      if (String(this.editingId) === String(id)) {
          // console.log(`Transaksi Biaya (${id}) sedang diedit. Mereset form.`); // Aktifkan jika perlu debug
          this._resetForm();
      }
      
      // ================== EDITAN DI SINI ==================
      // Ganti _loadTable() dengan manipulasi DOM
      if (deleteButtonElement) {
        deleteButtonElement.closest('tr').remove();
      } else {
        // Fallback
        console.warn("deleteButtonElement tidak ada, _loadTable() dijalankan sebagai fallback.");
        await this._loadTable();
      }
      // ====================================================

    } catch (error) {
      console.error(`Error di _handleDelete InputBiaya untuk ID ${id}:`, error);
      this.notification.show(`Error: ${error.message || 'Gagal menghapus transaksi'}`, 'error');
    }
  }

  async _handleSubmit() {
    // console.log("Memulai _handleSubmit InputBiaya. Mode edit:", this.editingId); // Aktifkan jika perlu debug
    const selectedKode = this.choicesInstance ? this.choicesInstance.getValue(true) : (this.kodeBiayaSelect ? this.kodeBiayaSelect.value : '');

    const data = {
      kodeBiaya: selectedKode,
      tanggal: this.tanggalInput ? this.tanggalInput.value : '',
      total: this.totalInput ? parseFloat(this.totalInput.value.replace(/[^0-9.-]+/g,"")) || 0 : 0,
      keterangan: this.keteranganInput ? this.keteranganInput.value : ''
    };

    if (!data.kodeBiaya) {
      console.warn("Submit InputBiaya dibatalkan: Kode Biaya kosong.", data);
      this.notification.show('Kode Biaya harus dipilih', 'error');
      return;
    }
    if (!data.tanggal) {
       console.warn("Submit InputBiaya dibatalkan: Tanggal kosong.", data);
       this.notification.show('Tanggal harus diisi', 'error');
       return;
    }
     if (data.total <= 0) {
       console.warn("Submit InputBiaya dibatalkan: Total tidak valid.", data);
       this.notification.show('Total harus lebih besar dari 0', 'error');
       return;
    }

    try {
      let message = '';
      if (this.editingId) {
        // console.log(`Mengirim PUT request ke /api/transaksibiaya/${this.editingId}`); // Aktifkan jika perlu debug
        await this.api.put(`/api/transaksibiaya/${this.editingId}`, data);
        message = 'Transaksi biaya berhasil di-update!';
      } else {
        // console.log("Mengirim POST request ke /api/transaksibiaya"); // Aktifkan jika perlu debug
        await this.api.post('/api/transaksibiaya', data);
        message = 'Transaksi biaya berhasil disimpan!';
      }
      this.notification.show(message, 'success');
      // console.log("Submit InputBiaya berhasil:", message); // Aktifkan jika perlu debug

      this._resetForm();
      await this._loadTable();
    } catch (error) {
      console.error("Error saat submit InputBiaya:", error);
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}