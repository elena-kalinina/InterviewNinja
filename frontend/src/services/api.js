/**
 * API Service - Handles all backend communication
 */

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  async fetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      // Handle binary responses (audio)
      if (options.responseType === 'blob') {
        return response.blob();
      }

      return response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Voice endpoints
  async startSession(params) {
    return this.fetch('/voice/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async respond(sessionId, userMessage, context = null) {
    return this.fetch('/voice/respond', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        user_message: userMessage,
        context: context,
      }),
    });
  }

  async textToSpeech(text) {
    return this.fetch('/voice/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
      responseType: 'blob',
    });
  }

  async getSession(sessionId) {
    return this.fetch(`/voice/session/${sessionId}`);
  }

  async endSession(sessionId) {
    return this.fetch(`/voice/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Session endpoints
  async saveSession(data) {
    return this.fetch('/session/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeSession(data) {
    return this.fetch('/session/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listSessions() {
    return this.fetch('/session/list');
  }

  async getSavedSession(sessionId) {
    return this.fetch(`/session/${sessionId}`);
  }

  // Scraper endpoints
  async scrapeUrl(url) {
    return this.fetch('/scraper/extract', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async previewUrl(url) {
    return this.fetch('/scraper/preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Code execution endpoints
  async executeCode(code, language = 'python', stdin = '') {
    return this.fetch('/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language, stdin }),
    });
  }

  async getRuntimes() {
    return this.fetch('/code/runtimes');
  }

  async validateCode(code, language = 'python') {
    return this.fetch('/code/validate', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }
}

export const api = new ApiService();
export default api;
