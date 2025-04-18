/**
 * Express middleware utilities
 * @module middleware
 */

import { logger } from './utils/logger.js';
import { errorHandler, ValidationError, AuthenticationError, AuthorizationError, RateLimitError } from './utils/errorHandlers.js';
import config from './config.js';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { performance } from 'perf_hooks';

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
    points: config.get('RATE_LIMIT_POINTS') || 100,
    duration: config.get('RATE_LIMIT_DURATION') || 60,
    blockDuration: config.get('RATE_LIMIT_BLOCK_DURATION') || 300
});

// Performance monitoring
const performanceMetrics = {
    requests: new Map(),
    startTime: Date.now()
};

// Authentication middleware
const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new AuthenticationError('Authentication token is required');
        }

        // TODO: Implement token verification logic
        // For now, just set a mock user
        req.user = {
            id: 'mock-user-id',
            role: 'user'
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthenticationError('User not authenticated');
            }

            if (!roles.includes(req.user.role)) {
                throw new AuthorizationError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Request validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req.body);
            if (error) {
                throw new ValidationError('Invalid request data', {
                    details: error.details
                });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Rate limiting middleware
const rateLimit = async (req, res, next) => {
    try {
        const key = req.ip;
        await rateLimiter.consume(key);
        next();
    } catch (error) {
        if (error instanceof Error) {
            next(error);
        } else {
            next(new RateLimitError('Too many requests'));
        }
    }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = performance.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Add request ID to request and response
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    // Log request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Log response
    res.on('finish', () => {
        const duration = performance.now() - start;
        logger.info('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration.toFixed(2)}ms`
        });

        // Track performance metrics
        performanceMetrics.requests.set(requestId, {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            timestamp: Date.now()
        });
    });

    next();
};

// Response compression middleware
const compress = compression({
    level: config.get('COMPRESSION_LEVEL') || 6,
    threshold: config.get('COMPRESSION_THRESHOLD') || 1024
});

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: 'sameorigin' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
});

// CORS middleware
const corsOptions = {
    origin: config.get('CORS_ORIGIN') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['x-request-id'],
    credentials: true,
    maxAge: 86400
};

const corsMiddleware = cors(corsOptions);

// Request sanitization middleware
const sanitize = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }
        });
    }

    next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    const start = performance.now();
    const requestId = req.requestId;

    res.on('finish', () => {
        const duration = performance.now() - start;
        const metrics = performanceMetrics.requests.get(requestId);

        if (metrics) {
            metrics.duration = duration;
            performanceMetrics.requests.set(requestId, metrics);
        }

        // Log slow requests
        if (duration > (config.get('SLOW_REQUEST_THRESHOLD') || 1000)) {
            logger.warn('Slow request detected', {
                requestId,
                method: req.method,
                path: req.path,
                duration: `${duration.toFixed(2)}ms`
            });
        }
    });

    next();
};

// Cache control middleware
const cacheControl = (req, res, next) => {
    if (req.method === 'GET') {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
};

// Export middleware
export {
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
}; 