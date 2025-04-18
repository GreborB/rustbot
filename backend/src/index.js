/**
 * Main application entry point
 * @module index
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { logger } from './utils/logger.js';
import { setupSocketHandlers } from './socketHandlers.js';
import { setupStorage } from './storage.js';
import { setupPairingHandlers } from './pairing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json({ limit: config.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    next();
});

// API routes
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', version: config.API_VERSION });
});

// Serve static files in production
if (config.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error handling request:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Setup socket handlers
setupSocketHandlers(io);
setupStorage(io);
setupPairingHandlers(io);

// Start server
const startServer = async () => {
    try {
        await new Promise((resolve) => {
            httpServer.listen(config.PORT, () => {
                logger.info('Server started', {
                    port: config.PORT,
                    environment: config.NODE_ENV
                });
                resolve();
            });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle server shutdown
const shutdownServer = async () => {
    try {
        logger.info('Shutting down server');
        await new Promise((resolve) => {
            httpServer.close(() => {
                logger.info('Server closed');
                resolve();
            });
        });
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);

// Start the server
startServer(); 