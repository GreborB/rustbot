import { io } from 'socket.io-client';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('steamToken');
        this.connected = false;
    }

    connect() {
        if (this.socket && this.socket.connected) {
            return;
        }

        if (!this.token) {
            console.error('No authentication token found');
            return;
        }

        this.socket = io(API_URL, {
            auth: {
                token: this.token
            },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.socket.emit('connectionStatus', { status: 'connected' });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.connected = false;
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                setTimeout(() => this.socket.connect(), 1000);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.connected = false;
            if (error.message === 'Authentication error') {
                localStorage.removeItem('steamToken');
                window.location.href = '/login';
            }
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.connected = false;
            if (error.message === 'Authentication error') {
                localStorage.removeItem('steamToken');
                window.location.href = '/login';
            }
        });

        this.socket.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    emit(event, data) {
        if (!this.socket || !this.connected) {
            console.error('Socket not connected');
            return;
        }
        this.socket.emit(event, data);
    }

    on(event, callback) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        this.socket.off(event, callback);
    }

    isConnected() {
        return this.connected;
    }
}

export const socketService = new SocketService(); 