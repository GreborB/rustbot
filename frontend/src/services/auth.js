import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async pair(code) {
    try {
      const response = await axios.post(`${API_URL}/auth/pair`, { code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Pairing failed');
    }
  },

  async checkStatus() {
    try {
      const response = await axios.get(`${API_URL}/auth/status`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check auth status');
    }
  },

  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`);
      localStorage.removeItem('token');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async connectToServer(serverInfo) {
    try {
      const response = await axios.post(`${API_URL}/connect`, serverInfo);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to connect to server');
    }
  },

  async disconnectFromServer() {
    try {
      await axios.post(`${API_URL}/disconnect`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect from server');
    }
  }
};

// Helper functions
export const loginWithSteam = () => {
  window.location.href = `${API_URL}/auth/steam`;
};

export const handleAuthCallback = async (token) => {
  try {
    localStorage.setItem('token', token);
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Auth callback error:', error);
    throw error;
  }
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = `${API_URL}/auth/logout`;
};

export const pairWithServer = async (serverInfo) => {
    try {
        const response = await axios.post(`${API_URL}/auth/pair`, serverInfo);
        return response.data;
    } catch (error) {
        console.error('Server pairing error:', error);
        throw error;
    }
};

export const getFCMCredentials = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/fcm-credentials`);
        return response.data;
    } catch (error) {
        console.error('FCM credentials error:', error);
        throw error;
    }
};

export const handlePairingRequest = async (pairingData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/pair`, pairingData);
        return response.data;
    } catch (error) {
        console.error('Pairing error:', error);
        throw error;
    }
};

export const getServerInfo = async () => {
    try {
        const response = await axios.get(`${API_URL}/server-info`);
        return response.data;
    } catch (error) {
        console.error('Server info error:', error);
        throw error;
    }
}; 