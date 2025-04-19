import axios from 'axios';
import { api } from './api';

const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
    constructor() {
        this.tokenRefreshTimeout = null;
    }

    // Token management
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        this.scheduleTokenRefresh();
    }

    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
            this.tokenRefreshTimeout = null;
        }
    }

    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    scheduleTokenRefresh() {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
        }

        // Refresh token 5 minutes before it expires
        this.tokenRefreshTimeout = setTimeout(async () => {
            try {
                await this.refreshToken();
            } catch (error) {
                console.error('Failed to refresh token:', error);
                this.clearTokens();
            }
        }, 10 * 60 * 1000); // 10 minutes
    }

    async register(username, password) {
        try {
            const response = await api.post('/auth/register', {
                username,
                password
            });
            const { accessToken, refreshToken } = response.data;
            this.setTokens(accessToken, refreshToken);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async login(username, password) {
        try {
            const response = await api.post('/auth/login', {
                username,
                password
            });
            const { accessToken, refreshToken } = response.data;
            this.setTokens(accessToken, refreshToken);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async logout() {
        try {
            const token = this.getAccessToken();
            if (token) {
                await api.post('/auth/logout', null, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            this.clearTokens();
        } catch (error) {
            this.clearTokens();
            throw new Error(error.response?.data?.message || 'Logout failed');
        }
    }

    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await api.post('/auth/refresh-token', {
                refreshToken
            });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            this.setTokens(accessToken, newRefreshToken);
            return accessToken;
        } catch (error) {
            this.clearTokens();
            throw new Error('Failed to refresh token');
        }
    }

    async getCurrentUser() {
        try {
            const token = this.getAccessToken();
            if (!token) return null;

            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const newToken = await this.refreshToken();
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${newToken}` }
                    });
                    return response.data;
                } catch (refreshError) {
                    this.clearTokens();
                    return null;
                }
            }
            return null;
        }
    }

    async requestPasswordReset(email) {
        try {
            await api.post('/auth/forgot-password', { email });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await api.post('/auth/reset-password', {
                token,
                password: newPassword
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
    }

    // API request interceptor
    setupAxiosInterceptors() {
        axios.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        const newToken = await this.refreshToken();
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        this.clearTokens();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    async connectToServer(serverInfo) {
        try {
            const token = this.getAccessToken();
            const response = await api.post('/connect', serverInfo, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to connect to server');
        }
    }

    async disconnectFromServer() {
        try {
            const token = this.getAccessToken();
            await api.post('/disconnect', null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to disconnect from server');
        }
    }

    async getFCMCredentials() {
        try {
            const token = this.getAccessToken();
            const response = await api.get('/fcm/credentials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get FCM credentials');
        }
    }

    async handlePairingRequest(pairingData) {
        try {
            const token = this.getAccessToken();
            const response = await api.post('/pairing/handle', pairingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to handle pairing request');
        }
    }

    async getServerInfo() {
        try {
            const token = this.getAccessToken();
            const response = await api.get('/server/info', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get server info');
        }
    }
}

// Create an instance of the service
const authService = new AuthService();

// Export the instance methods
export const {
    login,
    register,
    logout,
    getCurrentUser,
    getAccessToken,
    getRefreshToken,
    refreshToken
} = authService;

// Export Steam-specific functions
export const loginWithSteam = () => {
    window.location.href = `${API_URL}/auth/steam`;
};

export const handleAuthCallback = async (token) => {
    try {
        const response = await api.get('/auth/steam/callback', {
            params: { token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to handle Steam auth callback');
    }
};

export const pairWithServer = async (serverInfo) => {
    try {
        const token = authService.getAccessToken();
        const response = await api.post('/rust/pair', serverInfo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to pair with server');
    }
}; 