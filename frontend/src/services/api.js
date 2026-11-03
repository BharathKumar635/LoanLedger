/**
 * LoanLedger - Centralized Frontend API Service
 * 
 * Provides clean, configurable REST API communication with the backend.
 * The frontend NEVER communicates directly with MongoDB Atlas.
 */

const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : (typeof window !== 'undefined' && window.location.port === '5000'
      ? '/api'
      : 'http://localhost:5000/api');

const apiService = {
  baseUrl: API_BASE_URL,

  /**
   * Search borrowing records by surname, actual name, or mobile number
   */
  async searchBorrowings(query = '') {
    const url = query
      ? `${this.baseUrl}/borrowings/search?q=${encodeURIComponent(query)}`
      : `${this.baseUrl}/borrowings/search`;

    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to search records (HTTP ${response.status})`);
    }
    return response.json();
  },

  /**
   * Fetch an individual borrowing record by ID
   */
  async getBorrowingById(id) {
    const url = `${this.baseUrl}/borrowings/${encodeURIComponent(id)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Borrowing record not found (HTTP ${response.status})`);
    }
    return response.json();
  },

  /**
   * Submit and store a new borrowing record in MongoDB Atlas
   */
  async createBorrowing(borrowingData) {
    const url = `${this.baseUrl}/borrowings`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(borrowingData)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Submission failed (HTTP ${response.status})`);
    }
    return response.json();
  },

  /**
   * Health check for backend connectivity
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Support both ES module and browser script tag
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiService;
}
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

