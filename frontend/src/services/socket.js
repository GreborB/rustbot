import { io } from 'socket.io-client';

// Set API URL from environment variables with fallback
const API_URL = process.env.VITE_API_URL || window.location.origin.replace(/:\d+$/, '') + ':3001';
console.log('API URL:', API_URL);

class SocketService {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('steamToken');
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
        this.pendingMessages = [];
    }

    connect() {
        if (this.socket && this.socket.connected) {
            console.log('Socket already connected');
            return;
        }

        if (!this.token) {
            console.error('No authentication token found');
            return;
        }

        console.log('Attempting to connect to socket server at:', API_URL);
        
        try {
            this.socket = io(API_URL, {
                auth: {
                    token: this.token
                },
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                transports: ['websocket', 'polling'] // Add polling as fallback
            });

            this.setupEventListeners();
            this.socket.connect();
        } catch (error) {
            console.error('Error creating socket:', error);
        }
    }

    setupEventListeners() {
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Process any pending messages
            while (this.pendingMessages.length > 0) {
                const { event, data } = this.pendingMessages.shift();
                this.socket.emit(event, data);
            }
            
            this.socket.emit('connectionStatus', { status: 'connected' });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.connected = false;
            
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                setTimeout(() => {
                    if (this.socket) this.socket.connect();
                }, 1000);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.socket.disconnect();
            }
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    on(event, callback) {
        if (!this.socket) {
            console.warn(`Cannot add listener for '${event}' - socket not initialized`);
            return;
        }
        
        // Store the callback in our internal map for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (!this.socket) return;
        
        if (callback && this.listeners.has(event)) {
            // Remove specific callback
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
                this.socket.off(event, callback);
            }
        } else if (!callback && this.listeners.has(event)) {
            // Remove all callbacks for this event
            this.listeners.get(event).forEach(cb => {
                this.socket.off(event, cb);
            });
            this.listeners.delete(event);
        }
    }

    emit(event, data) {
        if (!this.socket || !this.connected) {
            console.warn(`Cannot emit '${event}' - socket not connected`);
            this.pendingMessages.push({ event, data });
            this.connect(); // Try to connect
            return;
        }
        
        try {
            this.socket.emit(event, data);
        } catch (error) {
            console.error(`Error emitting '${event}':`, error);
        }
    }

    disconnect() {
        if (this.socket) {
            // Clean up all listeners
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket.off(event, callback);
                });
            });
            this.listeners.clear();
            
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
}

// Create and export a singleton instance
export const socketService = new SocketService();

// For testing and debugging
window.socketService = socketService; 