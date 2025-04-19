import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
    constructor() {
        this.tokenRefreshTimeout = null;
    }

    async register(username, password) {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
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
            const response = await axios.post(`${API_URL}/auth/login`, {
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
                await axios.post(`${API_URL}/auth/logout`, null, {
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

            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
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

            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const newToken = await this.refreshToken();
                    const response = await axios.get(`${API_URL}/auth/profile`, {
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
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                token,
                password: newPassword
            });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
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
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/connect`, serverInfo, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to connect to server');
        }
    }

    async disconnectFromServer() {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/disconnect`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to disconnect from server');
        }
    }

    async getFCMCredentials() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/auth/fcm-credentials`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('FCM credentials error:', error);
            throw error;
        }
    }

    async handlePairingRequest(pairingData) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/auth/pair`, pairingData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Pairing error:', error);
            throw error;
        }
    }

    async getServerInfo() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/server-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Server info error:', error);
            throw error;
        }
    }
}

const authService = new AuthService();
authService.setupAxiosInterceptors();

export default authService;

// Helper functions
export const loginWithSteam = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/auth/steam${token ? `?token=${token}` : ''}`;
};

export const handleAuthCallback = async (token) => {
    try {
        localStorage.setItem('token', token);
        const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        localStorage.removeItem('token');
        console.error('Auth callback error:', error);
        throw error;
    }
};

export const pairWithServer = async (serverInfo) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/auth/pair`, serverInfo, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Server pairing error:', error);
        throw error;
    }
}; 