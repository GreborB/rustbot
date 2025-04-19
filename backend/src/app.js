import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';
import { sceneScheduler } from './services/sceneScheduler.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Error handling
app.use(errorHandler);

// Initialize scene scheduler
sceneScheduler.initialize().catch(error => {
  logger.error('Failed to initialize scene scheduler:', error);
});

export default app; 