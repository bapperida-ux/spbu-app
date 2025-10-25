// public/js/app.js

// Import semua class Page Anda
import { ApiService } from './apiService.js';
import { NotificationService } from './notificationService.js';
import { DashboardPage } from './dashboardPage.js'; 
import { KodeKasPage } from './kodeKasPage.js';
import { KodeBiayaPage } from './kodeBiayaPage.js';
import { InputKasPage } from './inputKasPage.js';
import { InputBiayaPage } from './inputBiayaPage.js';
import { TampilKasPage } from './tampilKasPage.js';
import { TampilBiayaPage } from './tampilBiayaPage.js';
import { BukuMarginPage } from './bukuMarginPage.js';

document.addEventListener('DOMContentLoaded', () => {

  // 1. Inisialisasi Service
  const api = new ApiService(); 
  const notification = new NotificationService();

  // 2. Buat instance SEMUA Page Manager
  const pageManagers = {
    'dashboard': new DashboardPage(api, notification), 
    'input-kode-kas': new KodeKasPage(api, notification),
    'input-kode-biaya': new KodeBiayaPage(api, notification),
    'input-kas': new InputKasPage(api, notification),
    'input-biaya': new InputBiayaPage(api, notification),
    'tampil-kas': new TampilKasPage(api, notification),
    'tampil-biaya': new TampilBiayaPage(api, notification),
    'buku-margin': new BukuMarginPage(api, notification),
  };

  // 3. Logika Navigasi Pindah Halaman (Fungsi showPage)
  const navLinks = document.querySelectorAll('.nav-link');
  const pageContents = document.querySelectorAll('.page-content');
  let currentPageManager = null; 

  function showPage(targetId) {
    console.log("Navigasi ke:", targetId);
    pageContents.forEach(page => page.classList.add('hidden'));
    const targetPageElement = document.getElementById(targetId);
    if (targetPageElement) {
      targetPageElement.classList.remove('hidden');
      navLinks.forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-target') === targetId) {
          nav.classList.add('active');
        }
      });
      const manager = pageManagers[targetId];
      if (manager && typeof manager.init === 'function') {
        try {
           console.log(`Memanggil init() untuk ${targetId}`);
           manager.init(); 
           currentPageManager = manager; 
        } catch (error) {
            console.error(`Error saat init ${targetId}:`, error);
            if(notification) notification.show(`Gagal memuat halaman ${targetId}`, "error");
        }
      } else {
        console.warn(`Tidak ada Page Manager atau method init() untuk ${targetId}`);
        currentPageManager = null;
      }
    } else {
      console.error(`Elemen halaman dengan ID "${targetId}" tidak ditemukan.`);
      showPage('dashboard');
    }
  }

  // Tambahkan event listener ke setiap link navigasi
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); 
      const targetId = link.getAttribute('data-target');
      if (targetId) {
        showPage(targetId);
      }
    });
  });

  // ================== LOGIKA BARU: SIDEBAR TOGGLE ==================
  const sidebarToggleBtn = document.getElementById('sidebar-toggle');
  const bodyElement = document.body; // Targetkan body untuk class collapse

  if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
          bodyElement.classList.toggle('sidebar-collapsed'); // Toggle class pada body

          // Opsional: Simpan state sidebar di localStorage
          if (bodyElement.classList.contains('sidebar-collapsed')) {
              localStorage.setItem('sidebarState', 'collapsed');
          } else {
              localStorage.setItem('sidebarState', 'expanded');
          }
      });

      // Opsional: Muat state sidebar saat halaman dimuat
      const savedSidebarState = localStorage.getItem('sidebarState');
      if (savedSidebarState === 'collapsed') {
          bodyElement.classList.add('sidebar-collapsed');
      }
  } else {
      console.warn("Tombol sidebar toggle (#sidebar-toggle) tidak ditemukan.");
  }
  // ================== AKHIR LOGIKA BARU ==================


  // 4. Tampilkan halaman awal (dashboard) saat aplikasi dimuat
  console.log("DOM siap, menampilkan dashboard...");
  showPage('dashboard'); 

});