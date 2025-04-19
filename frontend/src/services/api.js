import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor for authentication
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async login(username, password) {
        const response = await this.client.post('/users/login', { username, password });
        return response.data;
    }

    async register(username, password) {
        const response = await this.client.post('/users/register', { username, password });
        return response.data;
    }

    async getAutomations() {
        const response = await this.client.get('/automations');
        return response.data;
    }

    async createAutomation(data) {
        const response = await this.client.post('/automations', data);
        return response.data;
    }

    async updateAutomation(id, data) {
        const response = await this.client.put(`/automations/${id}`, data);
        return response.data;
    }

    async deleteAutomation(id) {
        const response = await this.client.delete(`/automations/${id}`);
        return response.data;
    }

    async getDevices() {
        const response = await this.client.get('/devices');
        return response.data;
    }

    async getScenes() {
        const response = await this.client.get('/scenes');
        return response.data;
    }

    async executeScene(id) {
        const response = await this.client.post(`/scenes/${id}/execute`);
        return response.data;
    }
}

export default new ApiService();
