/**
 * Application entry point
 * @module index
 */

import express from 'express';
import { initDatabase } from './config/database.js';
import { errorHandler } from './utils/errorHandlers.js';
import { logger } from './utils/logger.js';
import userRoutes from './routes/userRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sceneRoutes from './routes/sceneRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import rustRoutes from './routes/rustRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { config } from './config/config.js';
import { corsMiddleware } from './middleware/cors.js';
import rateLimit from 'express-rate-limit';

const app = express();

// Middleware
app.use(corsMiddleware); // Use our custom CORS middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Database initialization
const startServer = async () => {
    try {
        await initDatabase();
        logger.info('Database initialized successfully');
        
        const server = app.listen(config.server.port, () => {
            logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            logger.info('Received SIGINT. Starting graceful shutdown...');
            server.close(() => {
                logger.info('Server closed. Exiting process...');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            logger.info('Received SIGTERM. Starting graceful shutdown...');
            server.close(() => {
                logger.info('Server closed. Exiting process...');
                process.exit(0);
            });
        });

        process.on('unhandledRejection', (error) => {
            logger.error('Unhandled promise rejection:', error);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Health check routes
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/rust', rustRoutes);

// Error handling
app.use(errorHandler); 