import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { corsOptionsForWs } from '../middleware/cors.js';

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map();
    }

    initialize(server) {
        this.wss = new WebSocketServer({
            server,
            cors: corsOptionsForWs
        });

        this.wss.on('connection', (ws, req) => {
            const clientId = req.headers['sec-websocket-key'];
            this.clients.set(clientId, ws);

            logger.info(`New WebSocket connection: ${clientId}`);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                } catch (error) {
                    logger.error('Error handling WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
                logger.info(`WebSocket connection closed: ${clientId}`);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket error for client ${clientId}:`, error);
                this.clients.delete(clientId);
            });
        });

        logger.info('WebSocket server initialized');
    }

    handleMessage(clientId, data) {
        // Handle different message types
        switch (data.type) {
            case 'ping':
                this.sendToClient(clientId, { type: 'pong' });
                break;
            // Add more message type handlers as needed
            default:
                logger.warn(`Unknown message type: ${data.type}`);
        }
    }

    sendToClient(clientId, data) {
        const ws = this.clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcast(data) {
        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }
}

export const wsManager = new WebSocketManager(); 