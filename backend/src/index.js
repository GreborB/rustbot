/**
 * Application entry point
 * @module index
 */

import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import userRoutes from './routes/userRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sceneRoutes from './routes/sceneRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import { config } from './config/config.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
}));
app.use(express.json());

// Database initialization
const startServer = async () => {
  try {
    await initDatabase();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/automations', automationRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 