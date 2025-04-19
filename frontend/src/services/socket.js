import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import authService from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.isConnecting = false;
    }

    connect() {
        if (this.socket || this.isConnecting) {
            return;
        }

        this.isConnecting = true;
        const token = authService.getAccessToken();
        if (!token) {
            this.isConnecting = false;
            toast.error('Not authenticated. Please login.');
            return;
        }

        try {
            this.socket = io(API_URL, {
                auth: {
                    token: `Bearer ${token}`
                },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                withCredentials: true
            });

            this.setupEventListeners();
        } catch (error) {
            this.isConnecting = false;
            toast.error(`Connection error: ${error.message}`);
        }
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            toast.success('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.isConnecting = false;
            toast.warning('Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                toast.error('Failed to connect to server. Please refresh the page.');
            } else {
                toast.warning(`Connection error: ${error.message}`);
            }
        });

        this.socket.on('error', (error) => {
            toast.error(`Socket error: ${error.message}`);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    emit(event, data) {
        if (!this.socket || !this.isConnected) {
            throw new Error('Socket not connected');
        }
        return this.socket.emit(event, data);
    }

    on(event, callback) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        this.socket.off(event, callback);
    }
}

// Create and export a single instance
const socketService = new SocketService();
export default socketService; 