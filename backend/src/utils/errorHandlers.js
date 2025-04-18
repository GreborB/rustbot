/**
 * Error handling utilities
 * @module errorHandlers
 */

import { logger } from './logger.js';
import config from '../config.js';

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode, code, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

class AuthenticationError extends AppError {
    constructor(message, details = {}) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}

class AuthorizationError extends AppError {
    constructor(message, details = {}) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}

class NotFoundError extends AppError {
    constructor(message, details = {}) {
        super(message, 404, 'NOT_FOUND_ERROR', details);
    }
}

class ConflictError extends AppError {
    constructor(message, details = {}) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}

class RateLimitError extends AppError {
    constructor(message, details = {}) {
        super(message, 429, 'RATE_LIMIT_ERROR', details);
    }
}

class DatabaseError extends AppError {
    constructor(message, details = {}) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

class ServiceError extends AppError {
    constructor(message, details = {}) {
        super(message, 503, 'SERVICE_ERROR', details);
    }
}

// Error tracking and monitoring
class ErrorTracker {
    constructor() {
        this.errors = new Map();
        this.stats = {
            total: 0,
            byType: {},
            byCode: {},
            lastHour: 0,
            lastDay: 0
        };
        this.initialize();
    }

    initialize() {
        // Set up periodic cleanup
        setInterval(() => this.cleanup(), config.get('ERROR_CLEANUP_INTERVAL') || 3600000);
        
        // Set up periodic reporting
        setInterval(() => this.report(), config.get('ERROR_REPORT_INTERVAL') || 86400000);
    }

    track(error) {
        const now = Date.now();
        const errorKey = `${error.code}-${now}`;
        
        this.errors.set(errorKey, {
            error,
            timestamp: now,
            count: 1
        });

        // Update statistics
        this.stats.total++;
        this.stats.byType[error.constructor.name] = (this.stats.byType[error.constructor.name] || 0) + 1;
        this.stats.byCode[error.code] = (this.stats.byCode[error.code] || 0) + 1;
        this.stats.lastHour = this.getErrorCount(now - 3600000);
        this.stats.lastDay = this.getErrorCount(now - 86400000);

        // Check for error thresholds
        this.checkThresholds(error);
    }

    getErrorCount(since) {
        return Array.from(this.errors.values())
            .filter(e => e.timestamp >= since)
            .reduce((sum, e) => sum + e.count, 0);
    }

    checkThresholds(error) {
        const thresholds = config.getCategory('error_thresholds');
        
        // Check hourly threshold
        if (this.stats.lastHour >= (thresholds.HOURLY_THRESHOLD || 100)) {
            logger.warn('Error hourly threshold exceeded', {
                threshold: thresholds.HOURLY_THRESHOLD,
                count: this.stats.lastHour
            });
        }

        // Check daily threshold
        if (this.stats.lastDay >= (thresholds.DAILY_THRESHOLD || 1000)) {
            logger.error('Error daily threshold exceeded', {
                threshold: thresholds.DAILY_THRESHOLD,
                count: this.stats.lastDay
            });
        }

        // Check specific error type threshold
        const typeCount = this.stats.byType[error.constructor.name] || 0;
        if (typeCount >= (thresholds[`${error.constructor.name}_THRESHOLD`] || 50)) {
            logger.warn(`Error type threshold exceeded: ${error.constructor.name}`, {
                threshold: thresholds[`${error.constructor.name}_THRESHOLD`],
                count: typeCount
            });
        }
    }

    cleanup() {
        const retentionPeriod = config.get('ERROR_RETENTION_PERIOD') || 604800000; // 7 days
        const cutoff = Date.now() - retentionPeriod;
        
        for (const [key, error] of this.errors.entries()) {
            if (error.timestamp < cutoff) {
                this.errors.delete(key);
            }
        }
    }

    report() {
        logger.info('Error statistics report', this.stats);
    }

    getStats() {
        return { ...this.stats };
    }

    getErrors(since) {
        return Array.from(this.errors.values())
            .filter(e => !since || e.timestamp >= since)
            .map(e => e.error);
    }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    const errorTracker = new ErrorTracker();
    
    // Track the error
    errorTracker.track(err);

    // Log the error
    logger.error(err.message, err, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user?.id
    });

    // Determine status code
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Prepare error response
    const response = {
        status: 'error',
        message: isOperational ? err.message : 'An unexpected error occurred',
        code: err.code || 'INTERNAL_SERVER_ERROR',
        ...(config.get('NODE_ENV') === 'development' && {
            stack: err.stack,
            details: err.details
        })
    };

    // Send response
    res.status(statusCode).json(response);
};

// Error recovery strategies
const recoveryStrategies = {
    retry: async (operation, maxAttempts = 3, delay = 1000) => {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                return await operation();
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * attempts));
            }
        }
    },

    fallback: async (operation, fallbackOperation) => {
        try {
            return await operation();
        } catch (error) {
            logger.warn('Operation failed, using fallback', { error });
            return await fallbackOperation();
        }
    },

    circuitBreaker: (operation, options = {}) => {
        const {
            failureThreshold = 5,
            resetTimeout = 60000,
            timeout = 5000
        } = options;

        let failures = 0;
        let lastFailureTime = null;
        let state = 'CLOSED';

        return async (...args) => {
            if (state === 'OPEN') {
                if (Date.now() - lastFailureTime >= resetTimeout) {
                    state = 'HALF-OPEN';
                } else {
                    throw new ServiceError('Circuit breaker is open');
                }
            }

            try {
                const result = await Promise.race([
                    operation(...args),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Operation timeout')), timeout)
                    )
                ]);

                if (state === 'HALF-OPEN') {
                    state = 'CLOSED';
                    failures = 0;
                }

                return result;
            } catch (error) {
                failures++;
                lastFailureTime = Date.now();

                if (failures >= failureThreshold) {
                    state = 'OPEN';
                }

                throw error;
            }
        };
    }
};

// Export
export {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ServiceError,
    ErrorTracker,
    errorHandler,
    recoveryStrategies
}; 