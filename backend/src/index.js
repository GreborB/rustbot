/**
 * Application entry point
 * @module index
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import userRoutes from './routes/userRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sceneRoutes from './routes/sceneRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import rustRoutes from './routes/rustRoutes.js';
import { config } from './config/config.js';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Database initialization
const startServer = async () => {
    try {
        await initDatabase();
        logger.info('Database initialized successfully');
        
        // Start the server
        app.listen(config.server.port, () => {
            logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        environment: config.server.env,
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/rust', rustRoutes);

// Error handling
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
}); 