// public/js/apiService.js

export class ApiService {
  // Hapus constructor atau kosongkan
  // constructor(baseUrl) {
  //   this.baseUrl = baseUrl; // <-- Hapus atau komentar baris ini
  // }

  // Helper internal untuk menangani fetch dan error
  async _fetch(endpoint, options = {}) {
    // Pastikan endpoint dimulai dengan '/'
    if (!endpoint.startsWith('/')) {
      console.warn("ApiService: Endpoint sebaiknya dimulai dengan '/'");
      endpoint = '/' + endpoint;
    }
    console.log(`ApiService: Calling ${options.method || 'GET'} ${endpoint}`); // Logging

    try {
      // Langsung gunakan endpoint relatif
      const response = await fetch(endpoint, {
        ...options, // Gabungkan options default dan tambahan
        headers: {
          'Content-Type': 'application/json',
          ...options.headers, // Izinkan override atau penambahan header
        },
      });

      // Coba parse JSON, tangani jika body kosong atau bukan JSON
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          result = await response.json();
      } else {
          // Jika bukan JSON (misal, hanya teks atau response kosong dari DELETE)
          result = { message: response.statusText }; // Buat objek default
      }


      if (!response.ok) {
        // Gunakan pesan error dari body JSON jika ada, jika tidak gunakan statusText
        const errorMessage = result?.error || result?.message || response.statusText || `HTTP error! status: ${response.status}`;
        console.error(`Gagal melakukan request ke ${endpoint}: Status ${response.status}`, result);
        throw new Error(errorMessage);
      }

      return result;

    } catch (error) {
      // Tangani error network (seperti 'Failed to fetch', 'ERR_CONNECTION_REFUSED')
      console.error(`Gagal melakukan request ke ${endpoint}:`, error.message);
      // Lempar error lagi agar bisa ditangani di page
      throw new Error(error.message || 'Gagal terhubung ke server');
    }
  }

  // Helper untuk request GET
  async get(endpoint) {
    // Cukup panggil _fetch tanpa body
    return this._fetch(endpoint, { method: 'GET' });
  }

  // Helper untuk request POST
  async post(endpoint, data) {
    return this._fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Helper untuk request PUT
  async put(endpoint, data) {
    return this._fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Helper untuk request DELETE
  async delete(endpoint) {
    // DELETE biasanya tidak mengembalikan body JSON, _fetch akan menangani ini
    return this._fetch(endpoint, { method: 'DELETE' });
  }
}