import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { corsOptionsForWs } from '../middleware/cors.js';

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
    }

    initialize(server) {
        this.wss = new WebSocketServer({
            server,
            cors: corsOptionsForWs
        });

        this.wss.on('connection', (ws, req) => {
            const clientId = req.headers['sec-websocket-key'];
            this.clients.set(clientId, ws);
            this.reconnectAttempts.set(clientId, 0);

            logger.info(`New WebSocket connection: ${clientId}`);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                } catch (error) {
                    logger.error('Error handling WebSocket message:', error);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: 'Invalid message format'
                    });
                }
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
                this.reconnectAttempts.delete(clientId);
                logger.info(`WebSocket connection closed: ${clientId}`);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket error for client ${clientId}:`, error);
                this.handleError(clientId, error);
            });

            // Send initial connection success message
            this.sendToClient(clientId, {
                type: 'connection',
                status: 'success',
                message: 'Connected to WebSocket server'
            });
        });

        logger.info('WebSocket server initialized');
    }

    handleError(clientId, error) {
        const attempts = this.reconnectAttempts.get(clientId) || 0;
        if (attempts < this.maxReconnectAttempts) {
            this.reconnectAttempts.set(clientId, attempts + 1);
            logger.info(`Attempting to reconnect client ${clientId} (attempt ${attempts + 1})`);
            // Implement reconnection logic here if needed
        } else {
            logger.error(`Max reconnection attempts reached for client ${clientId}`);
            this.clients.delete(clientId);
            this.reconnectAttempts.delete(clientId);
        }
    }

    handleMessage(clientId, data) {
        try {
            switch (data.type) {
                case 'ping':
                    this.sendToClient(clientId, { type: 'pong' });
                    break;
                default:
                    logger.warn(`Unknown message type: ${data.type}`);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: 'Unknown message type'
                    });
            }
        } catch (error) {
            logger.error(`Error handling message for client ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Internal server error'
            });
        }
    }

    sendToClient(clientId, data) {
        const ws = this.clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(data));
            } catch (error) {
                logger.error(`Error sending message to client ${clientId}:`, error);
                this.handleError(clientId, error);
            }
        }
    }

    broadcast(data) {
        this.clients.forEach((ws, clientId) => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(data));
                } catch (error) {
                    logger.error(`Error broadcasting to client ${clientId}:`, error);
                    this.handleError(clientId, error);
                }
            }
        });
    }
}

export const wsManager = new WebSocketManager(); 