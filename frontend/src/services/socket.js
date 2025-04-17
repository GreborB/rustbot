import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.connectionStatus = 'disconnected';
        this.connectionError = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        try {
            if (this.socket?.connected) {
                console.log('Socket already connected');
                return;
            }

            this.socket = io({
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                timeout: 20000
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connectionStatus = 'connected';
                this.connectionError = null;
                this.reconnectAttempts = 0;
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
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('Max reconnection attempts reached');
                    this.disconnect();
                }
            });

            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                this.connectionStatus = 'error';
                this.connectionError = error.message;
            });

            this.socket.on('reconnect_attempt', (attempt) => {
                console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('Failed to reconnect after all attempts');
                this.connectionStatus = 'error';
                this.connectionError = 'Failed to reconnect to server';
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