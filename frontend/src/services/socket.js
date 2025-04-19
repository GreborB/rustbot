import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { getAccessToken } from './auth.js';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.eventListeners = new Map();
    }

    connect() {
        const token = getAccessToken();
        if (!token) {
            toast.error('Authentication required for socket connection');
            return;
        }

        this.socket = io(import.meta.env.VITE_API_URL, {
            auth: {
                token: `Bearer ${token}`
            },
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            timeout: 10000
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            toast.success('Connected to server');
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            toast.warning(`Disconnected from server: ${reason}`);
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                toast.error('Failed to connect to server after multiple attempts');
            } else {
                toast.warning(`Connection error: ${error.message}`);
            }
        });

        this.socket.on('error', (error) => {
            toast.error(`Socket error: ${error.message}`);
        });

        // Re-emit all stored event listeners
        this.eventListeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                this.socket.on(event, handler);
            });
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
            toast.error('Socket not connected');
            return;
        }

        try {
            this.socket.emit(event, data);
        } catch (error) {
            toast.error(`Failed to emit event: ${error.message}`);
        }
    }

    on(event, handler) {
        if (!this.socket) {
            // Store the handler for when the socket connects
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, new Set());
            }
            this.eventListeners.get(event).add(handler);
            return;
        }

        this.socket.on(event, handler);
    }

    off(event, handler) {
        if (!this.socket) {
            // Remove the stored handler
            if (this.eventListeners.has(event)) {
                this.eventListeners.get(event).delete(handler);
            }
            return;
        }

        this.socket.off(event, handler);
    }
}

// Export a single instance
export const socketService = new SocketService(); 