import { logger } from './logger.js';
import config from '../config.js';

// Custom error classes
export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

export class AuthenticationError extends AppError {
    constructor(message, details = {}) {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.details = details;
    }
}

export class AuthorizationError extends AppError {
    constructor(message, details = {}) {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.details = details;
    }
}

export class NotFoundError extends AppError {
    constructor(message, details = {}) {
        super(message, 404, 'NOT_FOUND_ERROR');
        this.details = details;
    }
}

export class ConflictError extends AppError {
    constructor(message, details = {}) {
        super(message, 409, 'CONFLICT_ERROR');
        this.details = details;
    }
}

export class RateLimitError extends AppError {
    constructor(message, details = {}) {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.details = details;
    }
}

export class DatabaseError extends AppError {
    constructor(message, details = {}) {
        super(message, 500, 'DATABASE_ERROR');
        this.details = details;
    }
}

export class ServiceError extends AppError {
    constructor(message, details = {}) {
        super(message, 503, 'SERVICE_ERROR');
        this.details = details;
    }
}

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        status: err.status || 500,
        code: err.code
    });

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: err.errors.map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0].path;
        return res.status(400).json({
            status: 'error',
            message: `${field} already exists`
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    // Handle custom AppError
    if (err.isOperational) {
        return res.status(err.status).json({
            status: 'error',
            message: err.message,
            code: err.code
        });
    }

    // Handle all other errors
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
}; 