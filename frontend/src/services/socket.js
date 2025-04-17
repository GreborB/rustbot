import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
            }
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
                // Handle authentication error (e.g., redirect to login)
                window.location.href = '/login';
            }
        });
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