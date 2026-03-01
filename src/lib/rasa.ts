/**
 * Rasa API Service
 * Handles communication with Rasa server
 */

export interface RasaMessage {
  message: string;
  sender: string;
}

export interface RasaResponse {
  text?: string;
  image?: string;
  buttons?: Array<{ title: string; payload: string }>;
  attachment?: any;
}

export class RasaService {
  private serverUrl: string;

  constructor(serverUrl: string = import.meta.env.VITE_RASA_SERVER_URL || 'http://localhost:5005') {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Send a message to Rasa and get a response
   */
  async sendMessage(message: string, senderId: string = 'user'): Promise<RasaResponse[]> {
    try {
      const response = await fetch(`${this.serverUrl}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sender: senderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rasa server responded with status: ${response.status}`);
      }

      const data: RasaResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error communicating with Rasa:', error);
      throw error;
    }
  }

  /**
   * Get Rasa server health status
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Rasa server health check failed:', error);
      return false;
    }
  }

  /**
   * Get Rasa server version
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await fetch(`${this.serverUrl}/version`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        return data.version || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching Rasa version:', error);
      return null;
    }
  }
}

export const rasaService = new RasaService();
