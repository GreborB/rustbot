/**
 * Main server file
 * @module server
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config.js';
import logger from './utils/logger.js';
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
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { sequelize } from './config/database.js';
import { userController, deviceController, sceneController, automationController } from './controllers/Index.js';

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.get('CORS_ORIGIN') || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400 // 24 hours
    }
});

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: config.get('CORS_ORIGIN'),
    credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userController);
app.use('/api/devices', deviceController);
app.use('/api/scenes', sceneController);
app.use('/api/automations', automationController);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        // Sync database models
        await sequelize.sync({ alter: true });
        logger.info('Database models synchronized.');

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

            // Close database connection
            await sequelize.close();
            logger.info('Database connection closed');

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

export default startServer; 