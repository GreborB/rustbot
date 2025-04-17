import { io } from 'socket.io-client';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('token');
    }

    connect() {
        if (this.socket) return;

        this.socket = io(API_URL, {
            auth: {
                token: this.token
            },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            if (error.message === 'Authentication error') {
                window.location.href = '/login';
            }
        });

        this.socket.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (!this.socket) {
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
}

export const socketService = new SocketService(); 