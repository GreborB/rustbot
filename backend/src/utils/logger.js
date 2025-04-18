/**
 * Logger utility
 * @module logger
 */

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config.js';
import DailyRotateFile from 'winston-daily-rotate-file';
import { createWriteStream } from 'fs';
import { Transform } from 'stream';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log levels with colors and descriptions
const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};

const COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'magenta'
};

const LEVEL_DESCRIPTIONS = {
    error: 'Error events that might still allow the application to continue running',
    warn: 'Potentially harmful situations',
    info: 'Informational messages that highlight the progress of the application',
    debug: 'Detailed information for debugging purposes',
    trace: 'Very detailed information for tracing execution flow'
};

// Add colors to winston
winston.addColors(COLORS);

// Log formats
const formats = {
    json: winston.format.json(),
    simple: winston.format.simple(),
    pretty: winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata, null, 2)}`;
        }
        return msg;
    })
};

/**
 * Logger class for managing application logging
 */
class Logger extends EventEmitter {
    constructor() {
        super();
        this.logger = null;
        this.stream = null;
        this.buffer = [];
        this.bufferSize = 0;
        this.bufferTimeout = null;
        this.metrics = {
            totalLogs: 0,
            errors: 0,
            warnings: 0,
            lastError: null,
            lastWarning: null,
            performance: {
                averageLogTime: 0,
                totalLogTime: 0
            }
        };
        this.initialize();
    }

    /**
     * Initialize the logger with configuration
     */
    initialize() {
        const logConfig = config.getCategory('logging');
        
        // Create the logger instance
        this.logger = winston.createLogger({
            level: logConfig.LOG_LEVEL || 'info',
            levels: LEVELS,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.metadata(),
                this.maskSensitiveData(),
                formats[logConfig.LOG_FORMAT] || formats.pretty
            ),
            transports: this.createTransports(logConfig),
            exceptionHandlers: this.createExceptionHandlers(logConfig),
            rejectionHandlers: this.createRejectionHandlers(logConfig)
        });

        // Create write stream for morgan
        this.stream = {
            write: (message) => {
                this.logger.info(message.trim());
            }
        };

        // Initialize buffer settings
        this.bufferSize = logConfig.LOG_BUFFER_SIZE || 100;
        this.bufferTimeout = logConfig.LOG_BUFFER_TIMEOUT || 1000;

        // Set up periodic metrics collection
        setInterval(() => this.collectMetrics(), logConfig.LOG_METRICS_INTERVAL || 60000);
    }

    /**
     * Create transports based on configuration
     * @param {Object} config - Logging configuration
     * @returns {Array} Array of winston transports
     */
    createTransports(config) {
        const transports = [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    formats.pretty
                )
            })
        ];

        // Add file transports if configured
        if (config.LOG_FILE) {
            const logPath = join(__dirname, '../../logs');
            
            // Add error log
            transports.push(new DailyRotateFile({
                filename: join(logPath, 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: config.LOG_MAX_SIZE || '10m',
                maxFiles: config.LOG_MAX_FILES || '14d',
                level: 'error',
                format: formats.json,
                zippedArchive: true,
                auditFile: join(logPath, 'error-audit.json')
            }));

            // Add combined log
            transports.push(new DailyRotateFile({
                filename: join(logPath, 'combined-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: config.LOG_MAX_SIZE || '10m',
                maxFiles: config.LOG_MAX_FILES || '14d',
                format: formats.json,
                zippedArchive: true,
                auditFile: join(logPath, 'combined-audit.json')
            }));
        }

        return transports;
    }

    /**
     * Create exception handlers
     * @param {Object} config - Logging configuration
     * @returns {Array} Array of exception handlers
     */
    createExceptionHandlers(config) {
        if (!config.LOG_FILE) return [];

        const logPath = join(__dirname, '../../logs');
        return [
            new DailyRotateFile({
                filename: join(logPath, 'exceptions-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: config.LOG_MAX_SIZE || '10m',
                maxFiles: config.LOG_MAX_FILES || '14d',
                format: formats.json,
                zippedArchive: true,
                auditFile: join(logPath, 'exceptions-audit.json')
            })
        ];
    }

    /**
     * Create rejection handlers
     * @param {Object} config - Logging configuration
     * @returns {Array} Array of rejection handlers
     */
    createRejectionHandlers(config) {
        if (!config.LOG_FILE) return [];

        const logPath = join(__dirname, '../../logs');
        return [
            new DailyRotateFile({
                filename: join(logPath, 'rejections-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: config.LOG_MAX_SIZE || '10m',
                maxFiles: config.LOG_MAX_FILES || '14d',
                format: formats.json,
                zippedArchive: true,
                auditFile: join(logPath, 'rejections-audit.json')
            })
        ];
    }

    /**
     * Mask sensitive data in logs
     * @returns {Object} Winston format
     */
    maskSensitiveData() {
        return winston.format((info) => {
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
            const maskedInfo = { ...info };

            for (const field of sensitiveFields) {
                if (maskedInfo[field]) {
                    maskedInfo[field] = '***MASKED***';
                }
            }

            return maskedInfo;
        })();
    }

    /**
     * Collect and update metrics
     */
    collectMetrics() {
        const now = Date.now();
        const metrics = {
            ...this.metrics,
            timestamp: now,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };

        this.emit('metrics', metrics);
    }

    /**
     * Set the log level
     * @param {string} level - New log level
     */
    setLogLevel(level) {
        if (LEVELS[level] === undefined) {
            this.warn(`Invalid log level "${level}". Using "info" instead.`);
            level = 'info';
        }
        this.logger.level = level;
    }

    /**
     * Log an error message
     * @param {string} message - Error message
     * @param {Error} [error] - Error object
     * @param {Object} [metadata] - Additional metadata
     */
    error(message, error, metadata = {}) {
        const startTime = performance.now();
        this.metrics.errors++;

        if (error instanceof Error) {
            metadata.error = {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code
            };
            this.metrics.lastError = {
                message,
                error: metadata.error,
                timestamp: Date.now()
            };
        }

        this.logger.error(message, metadata);
        this.updatePerformanceMetrics(startTime);
        this.emit('error', { message, error, metadata });
    }

    /**
     * Log a warning message
     * @param {string} message - Warning message
     * @param {Object} [metadata] - Additional metadata
     */
    warn(message, metadata = {}) {
        const startTime = performance.now();
        this.metrics.warnings++;
        this.metrics.lastWarning = {
            message,
            metadata,
            timestamp: Date.now()
        };

        this.logger.warn(message, metadata);
        this.updatePerformanceMetrics(startTime);
        this.emit('warn', { message, metadata });
    }

    /**
     * Log an info message
     * @param {string} message - Info message
     * @param {Object} [metadata] - Additional metadata
     */
    info(message, metadata = {}) {
        const startTime = performance.now();
        this.logger.info(message, metadata);
        this.updatePerformanceMetrics(startTime);
        this.emit('info', { message, metadata });
    }

    /**
     * Log a debug message
     * @param {string} message - Debug message
     * @param {Object} [metadata] - Additional metadata
     */
    debug(message, metadata = {}) {
        const startTime = performance.now();
        this.logger.debug(message, metadata);
        this.updatePerformanceMetrics(startTime);
        this.emit('debug', { message, metadata });
    }

    /**
     * Log a trace message
     * @param {string} message - Trace message
     * @param {Object} [metadata] - Additional metadata
     */
    trace(message, metadata = {}) {
        const startTime = performance.now();
        this.logger.log('trace', message, metadata);
        this.updatePerformanceMetrics(startTime);
        this.emit('trace', { message, metadata });
    }

    /**
     * Update performance metrics
     * @param {number} startTime - Start time of the log operation
     */
    updatePerformanceMetrics(startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.totalLogs++;
        this.metrics.performance.totalLogTime += duration;
        this.metrics.performance.averageLogTime = 
            this.metrics.performance.totalLogTime / this.metrics.totalLogs;
    }

    /**
     * Create a child logger with additional metadata
     * @param {Object} metadata - Additional metadata for the child logger
     * @returns {Object} Child logger instance
     */
    child(metadata) {
        return this.logger.child(metadata);
    }

    /**
     * Get the write stream for morgan
     * @returns {Object} Write stream
     */
    getStream() {
        return this.stream;
    }

    /**
     * Get current metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get log level descriptions
     * @returns {Object} Log level descriptions
     */
    getLevelDescriptions() {
        return { ...LEVEL_DESCRIPTIONS };
    }

    /**
     * Clear log buffer
     */
    clearBuffer() {
        this.buffer = [];
    }

    /**
     * Flush log buffer
     */
    flushBuffer() {
        if (this.buffer.length > 0) {
            for (const log of this.buffer) {
                this.logger.log(log.level, log.message, log.metadata);
            }
            this.clearBuffer();
        }
    }
}

// Create and export singleton instance
const loggerInstance = new Logger();
export { loggerInstance as logger }; 