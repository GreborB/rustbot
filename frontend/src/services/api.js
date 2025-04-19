import axios from 'axios';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: '/api',
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
    }

    async login(username, password) {
        const response = await this.client.post('/auth/login', { username, password });
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
}

const api = new ApiService();
export default api;
