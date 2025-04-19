import express from 'express';
import { wsManager } from '../websocket/server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

router.get('/health/ws', (req, res) => {
    try {
        const wsStatus = {
            isInitialized: !!wsManager.wss,
            activeConnections: wsManager.clients.size,
            circuitBreakerStatus: wsManager.circuitBreaker.isOpen ? 'open' : 'closed',
            failures: wsManager.circuitBreaker.failures
        };

        res.json({
            status: 'ok',
            websocket: wsStatus
        });
    } catch (error) {
        logger.error('Error checking WebSocket health:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check WebSocket health'
        });
    }
});

export default router; 