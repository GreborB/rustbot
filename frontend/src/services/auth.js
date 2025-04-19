import axios from 'axios';
import { API_BASE_URL } from './api.js';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                if (this.refreshToken) {
                    config.headers['x-refresh-token'] = this.refreshToken;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => {
                // Check for new tokens in response headers
                const newToken = response.headers['x-access-token'];
                const newRefreshToken = response.headers['x-refresh-token'];

                if (newToken) {
                    this.setToken(newToken);
                }
                if (newRefreshToken) {
                    this.setRefreshToken(newRefreshToken);
                }

                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                // Handle token refresh
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                            refreshToken: this.refreshToken
                        });

                        const { accessToken, refreshToken } = response.data;
                        this.setToken(accessToken);
                        this.setRefreshToken(refreshToken);

                        // Retry the original request
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // If refresh fails, logout the user
                        this.logout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    setRefreshToken(token) {
        this.refreshToken = token;
        localStorage.setItem('refreshToken', token);
    }

    async login(username, password) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password
            });

            const { accessToken, refreshToken, user } = response.data;
            this.setToken(accessToken);
            this.setRefreshToken(refreshToken);

            return user;
        } catch (error) {
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error.message);
            }
            throw error;
        }
    }

    logout() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    getAccessToken() {
        return this.token;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    async register(username, password) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username,
                password
            });
            const { accessToken, refreshToken } = response.data;
            this.setToken(accessToken);
            this.setRefreshToken(refreshToken);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const newToken = await this.refreshToken();
                    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${newToken}` }
                    });
                    return response.data;
                } catch (refreshError) {
                    this.logout();
                    return null;
                }
            }
            return null;
        }
    }

    async requestPasswordReset(email) {
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                token,
                password: newPassword
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
    }

    async connectToServer(serverInfo) {
        try {
            const token = this.getToken();
            const response = await axios.post(`${API_BASE_URL}/connect`, serverInfo, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to connect to server');
        }
    }

    async disconnectFromServer() {
        try {
            const token = this.getToken();
            await axios.post(`${API_BASE_URL}/disconnect`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to disconnect from server');
        }
    }

    async getFCMCredentials() {
        try {
            const token = this.getToken();
            const response = await axios.get(`${API_BASE_URL}/fcm/credentials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get FCM credentials');
        }
    }

    async handlePairingRequest(pairingData) {
        try {
            const token = this.getToken();
            const response = await axios.post(`${API_BASE_URL}/pairing/handle`, pairingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to handle pairing request');
        }
    }

    async getServerInfo() {
        try {
            const token = this.getToken();
            const response = await axios.get(`${API_BASE_URL}/server/info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get server info');
        }
    }
}

const authService = new AuthService();
export default authService;
export const { getAccessToken } = authService;

// Export Steam-specific functions
export const loginWithSteam = () => {
    window.location.href = `${API_BASE_URL}/auth/steam`;
};

export const handleAuthCallback = async (token) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/steam/callback`, {
            params: { token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to handle Steam auth callback');
    }
};

export const pairWithServer = async (serverInfo) => {
    try {
        const token = authService.getToken();
        const response = await axios.post(`${API_BASE_URL}/rust/pair`, serverInfo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to pair with server');
    }
}; 