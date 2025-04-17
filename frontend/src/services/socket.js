import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.connectionStatus = 'disconnected';
        this.connectionError = null;
    }

    connect() {
        try {
            this.socket = io('http://129.151.212.105:3001', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connectionStatus = 'connected';
                this.connectionError = null;
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from server:', reason);
                this.connectionStatus = 'disconnected';
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try to reconnect
                    this.socket.connect();
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.connectionStatus = 'error';
                this.connectionError = error.message;
            });

            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                this.connectionStatus = 'error';
                this.connectionError = error.message;
            });
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.connectionStatus = 'error';
            this.connectionError = error.message;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connectionStatus = 'disconnected';
            this.connectionError = null;
        }
    }

    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            error: this.connectionError
        };
    }

    on(event, callback) {
        if (!this.socket) {
            this.connect();
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (this.socket && this.listeners.has(event)) {
            if (callback) {
                this.listeners.get(event).delete(callback);
                this.socket.off(event, callback);
            } else {
                this.listeners.get(event).forEach(cb => {
                    this.socket.off(event, cb);
                });
                this.listeners.delete(event);
            }
        }
    }

    emit(event, data) {
        if (!this.socket) {
            this.connect();
        }
        
        if (this.connectionStatus !== 'connected') {
            console.warn('Attempting to emit while disconnected');
            return;
        }

        this.socket.emit(event, data);
    }
}

export const socketService = new SocketService(); 