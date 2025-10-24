// public/js/notificationService.js

export class NotificationService {
  constructor() {
    this.toastElement = document.getElementById('notification-toast');
    this.messageElement = document.getElementById('toast-message');
    this.iconElement = document.getElementById('toast-icon');
    this.timer = null;
  }

  /**
   * Menampilkan notifikasi toast.
   * @param {string} message Pesan yang akan ditampilkan.
   * @param {string} type Tipe notifikasi ('success' atau 'error').
   * @param {number} duration Durasi dalam milidetik (default: 3000).
   */
  show(message, type = 'success', duration = 3000) {
    // Hapus timer sebelumnya jika ada
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Atur pesan dan ikon
    this.messageElement.innerText = message;
    
    // Hapus kelas tipe sebelumnya
    this.toastElement.classList.remove('success', 'error');

    // Tambahkan kelas tipe baru dan ikon
    if (type === 'success') {
      this.toastElement.classList.add('success');
      this.iconElement.innerText = '✅'; // Ikon sukses
    } else if (type === 'error') {
      this.toastElement.classList.add('error');
      this.iconElement.innerText = '❌'; // Ikon error
    }

    // Tampilkan toast
    this.toastElement.classList.remove('hidden');
    // Kita butuh jeda sesaat agar transisi CSS 'show' bisa berjalan
    setTimeout(() => {
      this.toastElement.classList.add('show');
    }, 10); 

    // Sembunyikan toast setelah durasi tertentu
    this.timer = setTimeout(() => {
      this.toastElement.classList.remove('show');
    }, duration);
  }
}