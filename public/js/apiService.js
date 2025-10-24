// public/js/apiService.js

export class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Helper untuk request GET
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Gagal melakukan GET request ke ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper untuk request POST
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Respon server tidak OK');
      }
      return result;
      
    } catch (error) {
      console.error(`Gagal melakukan POST request ke ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper untuk request PUT (BARU)
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT', // Method PUT untuk Update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Respon server tidak OK');
      }
      return result;
      
    } catch (error) {
      console.error(`Gagal melakukan PUT request ke ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper untuk request DELETE
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Gagal menghapus data');
      }
      return await response.json();
    } catch (error) {
      console.error(`Gagal melakukan DELETE request ke ${endpoint}:`, error);
      throw error;
    }
  }
}