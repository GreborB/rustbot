/**
 * Logger utility
 * @module logger
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from '../config/config.js';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                logFormat
            ),
        }),
        // Rotating file transport for errors
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // Rotating file transport for all logs
        new winston.transports.File({ filename: 'combined.log' })
    ],
});

export { logger }; 