/**
 * Main server file
 * @module server
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errorHandlers.js';
import {
    authenticate,
    authorize,
    validate,
    rateLimit,
    requestLogger,
    compress,
    securityHeaders,
    corsMiddleware,
    sanitize,
    performanceMonitor,
    cacheControl
} from './middleware.js';

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.get('CORS_ORIGIN'),
        methods: config.get('CORS_METHODS'),
        allowedHeaders: config.get('CORS_ALLOWED_HEADERS'),
        credentials: config.get('CORS_CREDENTIALS')
    }
});

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(compress);
app.use(requestLogger);
app.use(performanceMonitor);
app.use(cacheControl);
app.use(sanitize);
app.use(rateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        const port = config.get('PORT');
        const host = config.get('HOST');

        httpServer.listen(port, host, () => {
            logger.info(`Server started on ${host}:${port}`);
        });

        // Handle server shutdown
        const shutdown = async () => {
            logger.info('Shutting down server...');
            
            // Close HTTP server
            httpServer.close(() => {
                logger.info('HTTP server closed');
            });

            // Close Socket.IO server
            io.close(() => {
                logger.info('Socket.IO server closed');
            });

            // Force shutdown after timeout
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, config.get('SHUTDOWN_TIMEOUT'));
        };

        // Handle shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

// Export server instance
export { app, httpServer, io, startServer }; 