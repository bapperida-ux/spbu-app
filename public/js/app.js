// public/js/app.js

import { ApiService } from './apiService.js';
import { DashboardPage } from './dashboardPage.js';
import { KodeKasPage } from './kodeKasPage.js';
import { KodeBiayaPage } from './kodeBiayaPage.js';
import { NotificationService } from './notificationService.js';
import { InputKasPage } from './inputKasPage.js';
import { InputBiayaPage } from './inputBiayaPage.js';
import { TampilKasPage } from './tampilKasPage.js';
import { TampilBiayaPage } from './tampilBiayaPage.js';
// --- IMPORT BARU ---
import { BukuMarginPage } from './bukuMarginPage.js'; // Pastikan file ini ada

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Logika Navigasi Pindah Halaman
  const navLinks = document.querySelectorAll('.nav-link');
  const pageContents = document.querySelectorAll('.page-content');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => { 
      e.preventDefault(); 
      
      const targetId = link.getAttribute('data-target');
      
      pageContents.forEach(page => page.classList.add('hidden'));
      
      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        targetPage.classList.remove('hidden');
      } else {
        console.error(`Elemen dengan ID "${targetId}" tidak ditemukan.`); 
      }
      
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // 2. Inisialisasi Aplikasi
  
  const api = new ApiService('http://localhost:3000');
  const notification = new NotificationService(); 
  
  // Inisialisasi semua "Manajer Halaman"
  // Pastikan SEMUA class ini sudah ada di folder js/ Anda
  try {
    const dashboard = new DashboardPage(api);
    const kodeKas = new KodeKasPage(api, notification); 
    const kodeBiaya = new KodeBiayaPage(api, notification);
    const inputKas = new InputKasPage(api, notification);
    const inputBiaya = new InputBiayaPage(api, notification);
    const tampilKas = new TampilKasPage(api, notification);
    const tampilBiaya = new TampilBiayaPage(api, notification);
    // --- INISIALISASI BARU ---
    const bukuMargin = new BukuMarginPage(api, notification); // Inisialisasi Buku Margin
    
    // Perintahkan setiap "Manajer Halaman" untuk mulai bekerja
    dashboard.init();
    kodeKas.init();
    kodeBiaya.init();
    inputKas.init();
    inputBiaya.init();
    tampilKas.init();
    tampilBiaya.init();
    // --- INIT BARU ---
    bukuMargin.init(); // Panggil init Buku Margin
    
    console.log("Semua halaman berhasil diinisialisasi."); 
    
  } catch (error) {
     console.error("Error saat inisialisasi halaman:", error); 
     // notification.show("Terjadi error saat memuat aplikasi.", "error");
  }
});