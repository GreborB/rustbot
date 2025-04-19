import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { corsOptionsForWs } from '../middleware/cors.js';
import { createCircuitBreaker } from '../utils/circuitBreaker.js';

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.circuitBreaker = createCircuitBreaker({
            failureThreshold: 3,
            resetTimeout: 30000
        });
    }

    initialize(server) {
        this.wss = new WebSocketServer({
            server,
            cors: corsOptionsForWs
        });

        this.wss.on('connection', async (ws, req) => {
            const clientId = req.headers['sec-websocket-key'];
            
            try {
                await this.circuitBreaker.execute(async () => {
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
            } catch (error) {
                logger.error(`Failed to establish WebSocket connection for client ${clientId}:`, error);
                ws.close(1013, 'Service temporarily unavailable');
            }
        });

        logger.info('WebSocket server initialized');
    }

    handleError(clientId, error) {
        const attempts = this.reconnectAttempts.get(clientId) || 0;
        if (attempts < this.maxReconnectAttempts) {
            this.reconnectAttempts.set(clientId, attempts + 1);
            logger.info(`Attempting to reconnect client ${clientId} (attempt ${attempts + 1})`);
            
            // Implement reconnection logic
            setTimeout(() => {
                if (this.clients.has(clientId)) {
                    const ws = this.clients.get(clientId);
                    if (ws.readyState !== WebSocket.OPEN) {
                        this.clients.delete(clientId);
                        this.reconnectAttempts.delete(clientId);
                    }
                }
            }, 5000);
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

    async sendToClient(clientId, data) {
        const ws = this.clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                await this.circuitBreaker.execute(async () => {
                    ws.send(JSON.stringify(data));
                });
            } catch (error) {
                logger.error(`Error sending message to client ${clientId}:`, error);
                this.handleError(clientId, error);
            }
        }
    }

    async broadcast(data) {
        for (const [clientId, ws] of this.clients.entries()) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    await this.sendToClient(clientId, data);
                } catch (error) {
                    logger.error(`Error broadcasting to client ${clientId}:`, error);
                }
            }
        }
    }
}

export const wsManager = new WebSocketManager(); 