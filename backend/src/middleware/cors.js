import cors from 'cors';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

// List of allowed origins
const allowedOrigins = [
    'http://localhost:3001', // Development
    'http://localhost:3000', // Development alternative
    process.env.FRONTEND_URL, // Production
    process.env.CORS_ORIGIN // Custom origin from env
].filter(Boolean); // Remove any undefined values

// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'x-refresh-token',
        'x-access-token'
    ],
    exposedHeaders: [
        'x-access-token',
        'x-refresh-token'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Create CORS middleware
export const corsMiddleware = cors(corsOptions);

// Export CORS options for WebSocket
export const corsOptionsForWs = {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true
}; 