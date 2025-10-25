// public/js/inputKasPage.js
import Choices from 'https://esm.sh/choices.js';

export class InputKasPage {
  constructor(apiService, notificationService) {
    this.api = apiService;
    this.notification = notificationService;

    // Kosongkan constructor
    this.editingId = null;
    this.kodeKasMap = new Map();
    this.choicesInstance = null; // Simpan instance Choices.js

    this.form = null;
    this.tableBody = null;
    this.kodeKasSelect = null;
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
    this.form = document.getElementById('form-input-kas');
    this.tableBody = document.getElementById('tabel-input-kas-body');
    this.kodeKasSelect = document.getElementById('input-kas-kode');

    // Penjaga anti-crash
    if (!this.form || !this.tableBody || !this.kodeKasSelect) {
      // console.log("InputKasPage: Elemen tidak ditemukan, init() dihentikan."); // Aktifkan jika perlu debug
      return;
    }

    // Lanjutkan cari elemen sisa
    this.formTitle = document.getElementById('form-input-kas-title');
    this.tanggalInput = document.getElementById('input-kas-tanggal');
    this.totalInput = document.getElementById('input-kas-total');
    this.keteranganInput = document.getElementById('input-kas-keterangan');
    this.simpanBtn = this.form.querySelector('.btn-simpan');
    this.batalBtn = this.form.querySelector('.btn-batal');

    // Set tanggal default & listener form
    this._setDefaultTanggal();
    this._setupFormEventListeners();

    // Muat dropdown dan tabel awal
    await this._populateDropdown(); // Tunggu dropdown selesai dimuat
    await this._loadTable(); // Baru muat tabel

    // Tambahkan listener focus
    this._setupFocusListener();

    // console.log("InputKasPage: init() selesai."); // Aktifkan jika perlu debug
  }

  _setDefaultTanggal() {
    if (this.tanggalInput && !this.tanggalInput.value) {
      try {
        this.tanggalInput.value = new Date().toISOString().split('T')[0];
      } catch (e) {
        console.error("Gagal set tanggal default:", e);
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

    // Listener untuk edit/delete di tabel
    this.tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.action-btn.edit');
        const deleteButton = e.target.closest('.action-btn.delete');

        if (editButton) {
            const id = editButton.getAttribute('data-id');
            if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-trx-id')) this._handleEditClick(id);
             else console.error('Tombol Edit InputKas tidak memiliki data-id valid.');
        } else if (deleteButton) {
            const id = deleteButton.getAttribute('data-id');
            if (id && id !== 'null' && id !== 'undefined' && !id.startsWith('invalid-trx-id')) this._handleDelete(id);
             else console.error('Tombol Delete InputKas tidak memiliki data-id valid.');
        }
    });

    this._formListenersAttached = true;
    // console.log("InputKasPage: Form listeners ditambahkan."); // Aktifkan jika perlu debug
  }

  _setupFocusListener() {
      // Hanya tambahkan satu kali
      if (window._inputKasFocusListenerAttached) return;

      window.addEventListener('focus', async () => {
          // console.log("Window focused - InputKasPage"); // Aktifkan jika perlu debug
          // Cek flag di localStorage
          if (localStorage.getItem('kodeKasUpdated') === 'true') {
              console.log("Detected kodeKasUpdated flag. Refreshing dropdown Kas..."); // Tetap log ini
              localStorage.removeItem('kodeKasUpdated'); // Hapus flag
              // Pastikan elemen select masih ada sebelum memuat ulang
              if(document.getElementById('input-kas-kode')){
                  await this._populateDropdown(); // Muat ulang dropdown
                  this.notification.show('Daftar Kode Kas diperbarui.', 'info');
              } else {
                  console.warn("Elemen select Kode Kas tidak ditemukan saat focus event.");
              }
          }
      });
      window._inputKasFocusListenerAttached = true; // Tandai sudah ditambahkan
      // console.log("InputKasPage: Focus listener ditambahkan."); // Aktifkan jika perlu debug
  }

  async _populateDropdown() {
    // console.log("Memuat dropdown KodeKas..."); // Aktifkan jika perlu debug
    // Pastikan elemen select masih ada
    if (!this.kodeKasSelect) {
        console.error("Elemen select Kode Kas tidak ditemukan saat _populateDropdown.");
        return;
    }
    try {
      const kodeKasList = await this.api.get('/api/kodekas');
      this.kodeKasMap.clear();

      const choicesOptions = [{ value: '', label: 'Pilih Kode Kas...', selected: true, disabled: true }];

      kodeKasList.forEach(kode => {
        this.kodeKasMap.set(kode.kode, kode);
        choicesOptions.push({
          value: kode.kode,
          label: `${kode.kode} - ${kode.uraian} (${kode.jenis})`
        });
      });

      // ===== PERBAIKAN: Gunakan setChoices jika instance sudah ada =====
      if (this.choicesInstance) {
        // console.log("Instance Choices.js (Kas) sudah ada, memperbarui pilihan..."); // Aktifkan jika perlu debug
        this.choicesInstance.setChoices(choicesOptions, 'value', 'label', true);
      } else {
        // console.log("Membuat instance Choices.js (Kas) baru..."); // Aktifkan jika perlu debug
        this.choicesInstance = new Choices(this.kodeKasSelect, {
          choices: choicesOptions,
          searchEnabled: true,
          itemSelectText: 'Tekan enter untuk memilih',
          shouldSort: false,
        });
      }
      // ====================================================================

      // console.log("Dropdown KodeKas berhasil dimuat/diperbarui."); // Aktifkan jika perlu debug

    } catch (error) {
      console.error("Error memuat dropdown KodeKas:", error);
      this.notification.show('Gagal memuat daftar Kode Kas', 'error');
      // Jika gagal, reset state Choices.js
      if (this.choicesInstance) {
          this.choicesInstance.destroy();
          this.choicesInstance = null;
      }
      // Pastikan elemen select masih ada sebelum ubah HTML
       if (this.kodeKasSelect) {
           this.kodeKasSelect.innerHTML = '<option value="">Gagal memuat</option>';
       }
    }
  }


  async _loadTable() {
    // console.log("Memuat tabel InputKas..."); // Aktifkan jika perlu debug
    // Pastikan elemen tabel masih ada
    if (!this.tableBody) {
        console.error("Elemen tabel InputKas tidak ditemukan saat _loadTable.");
        return;
    }
    try {
      const transactions = await this.api.get('/api/transaksikas?limit=10&sort=desc');
      this.tableBody.innerHTML = '';

      if (transactions && Array.isArray(transactions)) {
          transactions.forEach(trx => {
              this.tableBody.appendChild(this._createRow(trx));
          });
          // console.log(`Tabel InputKas dimuat dengan ${transactions.length} item.`); // Aktifkan jika perlu debug
      } else {
          console.warn("_loadTable InputKas: Data transaksi tidak valid atau kosong.", transactions);
      }
    } catch (error) {
      console.error("Error memuat tabel InputKas:", error);
      this.notification.show('Gagal memuat riwayat transaksi kas', 'error');
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
    const kodeDetail = this.kodeKasMap.get(trx.kodeKas);
    const uraian = kodeDetail ? kodeDetail.uraian : 'Kode tidak ditemukan';
    const jenis = kodeDetail ? kodeDetail.jenis : '-';
    const trxId = trx && trx.id ? trx.id : `invalid-trx-id-${Math.random()}`;
    if (!trx || !trx.id) { console.warn("Membuat baris transaksi Kas tanpa ID valid:", trx); }

    row.innerHTML = `
      <td>${this._formatTanggal(trx.tanggal)}</td>
      <td>${trx.kodeKas}</td>
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
    // console.log("Mereset form InputKas."); // Aktifkan jika perlu debug
    if (this.form) this.form.reset();
    this.editingId = null;
    if (this.simpanBtn) this.simpanBtn.innerText = 'Simpan';
    if (this.formTitle) this.formTitle.innerText = 'Formulir Input Kas';
    this._setDefaultTanggal();
    if(this.choicesInstance) {
        // Coba reset pilihan dan input pencarian
        try {
            this.choicesInstance.clearStore(); // Hapus semua pilihan
            this.choicesInstance.setChoices([{ value: '', label: 'Pilih Kode Kas...', selected: true, disabled: true }], 'value', 'label', true); // Tambah placeholder lagi
            this.choicesInstance.clearInput(); // Hapus teks di input
        } catch (e) {
            console.error("Gagal mereset Choices.js:", e);
            // Fallback jika error
            if (this.kodeKasSelect) this.kodeKasSelect.value = '';
        }

    } else if (this.kodeKasSelect) {
        // Fallback jika instance tidak ada
        this.kodeKasSelect.value = '';
    }
    const formContainer = this.form ? this.form.closest('.form-container') : null;
    if (formContainer) formContainer.classList.remove('editing');
  }

  async _handleEditClick(id) {
    // console.log(`Memulai _handleEditClick InputKas untuk ID: ${id}`); // Aktifkan jika perlu debug
    try {
      const trx = await this.api.get(`/api/transaksikas/${id}`);
      // console.log("Data TransaksiKas untuk edit diterima:", trx); // Aktifkan jika perlu debug

      if (this.tanggalInput) this.tanggalInput.value = trx.tanggal ? trx.tanggal.split('T')[0] : ''; // Format YYYY-MM-DD + cek null
      if (this.totalInput) this.totalInput.value = trx.total ?? '';
      if (this.keteranganInput) this.keteranganInput.value = trx.keterangan ?? '';

      if (this.choicesInstance) {
          this.choicesInstance.setChoiceByValue(String(trx.kodeKas ?? '')); // Pastikan string & handle null
      } else if (this.kodeKasSelect) {
          this.kodeKasSelect.value = trx.kodeKas ?? '';
      }

      this.editingId = trx.id;
      if (this.simpanBtn) this.simpanBtn.innerText = 'Update';
      if (this.formTitle) this.formTitle.innerText = 'Edit Transaksi Kas';

      const formContainer = this.form ? this.form.closest('.form-container') : null;
      if (formContainer) formContainer.classList.add('editing');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
       console.error(`Error di _handleEditClick InputKas untuk ID ${id}:`, error);
      this.notification.show('Gagal mengambil data transaksi untuk diedit', 'error');
    }
  }

  async _handleDelete(id) {
    // console.log(`Memulai _handleDelete InputKas untuk ID: ${id}`); // Aktifkan jika perlu debug
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi kas ini?')) {
        // console.log("Penghapusan TransaksiKas dibatalkan."); // Aktifkan jika perlu debug
        return;
    }

    try {
      await this.api.delete(`/api/transaksikas/${id}`);
      this.notification.show('Transaksi kas berhasil dihapus', 'success');
      // console.log(`Transaksi kas ID ${id} berhasil dihapus.`); // Aktifkan jika perlu debug

      if (String(this.editingId) === String(id)) {
          // console.log(`Transaksi Kas (${id}) sedang diedit. Mereset form.`); // Aktifkan jika perlu debug
          this._resetForm();
      }

      await this._loadTable();
    } catch (error) {
      console.error(`Error di _handleDelete InputKas untuk ID ${id}:`, error);
      this.notification.show(`Error: ${error.message || 'Gagal menghapus transaksi'}`, 'error');
    }
  }

  async _handleSubmit() {
    // console.log("Memulai _handleSubmit InputKas. Mode edit:", this.editingId); // Aktifkan jika perlu debug
    const selectedKode = this.choicesInstance ? this.choicesInstance.getValue(true) : (this.kodeKasSelect ? this.kodeKasSelect.value : '');

    const data = {
      kodeKas: selectedKode,
      tanggal: this.tanggalInput ? this.tanggalInput.value : '',
      total: this.totalInput ? parseFloat(this.totalInput.value.replace(/[^0-9.-]+/g,"")) || 0 : 0,
      keterangan: this.keteranganInput ? this.keteranganInput.value : ''
    };

    if (!data.kodeKas) {
      console.warn("Submit InputKas dibatalkan: Kode Kas kosong.", data);
      this.notification.show('Kode Kas harus dipilih', 'error');
      return;
    }
    if (!data.tanggal) {
       console.warn("Submit InputKas dibatalkan: Tanggal kosong.", data);
       this.notification.show('Tanggal harus diisi', 'error');
       return;
    }
     if (data.total <= 0) {
       console.warn("Submit InputKas dibatalkan: Total tidak valid.", data);
       this.notification.show('Total harus lebih besar dari 0', 'error');
       return;
    }


    try {
      let message = '';
      if (this.editingId) {
        // console.log(`Mengirim PUT request ke /api/transaksikas/${this.editingId}`); // Aktifkan jika perlu debug
        await this.api.put(`/api/transaksikas/${this.editingId}`, data);
        message = 'Transaksi kas berhasil di-update!';
      } else {
        // console.log("Mengirim POST request ke /api/transaksikas"); // Aktifkan jika perlu debug
        await this.api.post('/api/transaksikas', data);
        message = 'Transaksi kas berhasil disimpan!';
      }
      this.notification.show(message, 'success');
      // console.log("Submit InputKas berhasil:", message); // Aktifkan jika perlu debug

      this._resetForm();
      await this._loadTable();
    } catch (error) {
      console.error("Error saat submit InputKas:", error);
      this.notification.show(`Error: ${error.message}`, 'error');
    }
  }
}