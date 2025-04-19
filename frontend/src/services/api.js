import axios from 'axios';
import { getAccessToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                const newToken = await refreshToken();
                if (newToken) {
                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // If refresh fails, redirect to login
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const updateUser = async (userData) => {
    const response = await api.put('/auth/me', userData);
    return response.data;
};

export const getServerInfo = async () => {
    const response = await api.get('/server/info');
    return response.data;
};

export const sendCommand = async (command) => {
    const response = await api.post('/commands', { command });
    return response.data;
};

export const getPlayerInfo = async (playerId) => {
    const response = await api.get(`/players/${playerId}`);
    return response.data;
};

export const getVendingMachines = async () => {
    const response = await api.get('/vending');
    return response.data;
};

export const getUpkeepInfo = async () => {
    const response = await api.get('/upkeep');
    return response.data;
};

export const getRecycleInfo = async () => {
    const response = await api.get('/recycle');
    return response.data;
};

export const getTimers = async () => {
    const response = await api.get('/timers');
    return response.data;
};

export const toggleSwitch = async (switchId) => {
    const response = await api.post(`/switches/${switchId}/toggle`);
    return response.data;
};

export default api;
