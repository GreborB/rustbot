import { RateLimiterMemory } from 'rate-limiter-flexible';
import helmet from 'helmet';
import config from '../config.js';
import logger from '../utils/logger.js';

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
    points: config.get('RATE_LIMIT_POINTS') || 100, // Number of points
    duration: config.get('RATE_LIMIT_DURATION') || 60, // Per duration in seconds
});

// Rate limiting middleware
export const rateLimitMiddleware = async (req, res, next) => {
    try {
        const key = req.ip; // Use IP as the key
        await rateLimiter.consume(key);
        next();
    } catch (error) {
        logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later'
            }
        });
    }
};

// Security headers middleware
export const securityHeadersMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", config.get('CORS_ORIGIN')],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
});

// Request validation middleware
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));

                logger.warn('Request validation failed', { errors });
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: errors,
                    },
                });
            }

            next();
        } catch (error) {
            logger.error('Request validation error', { error });
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An error occurred during request validation',
                },
            });
        }
    };
};

// API key validation middleware
export const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'MISSING_API_KEY',
                message: 'API key is required',
            },
        });
    }

    if (apiKey !== config.get('API_KEY')) {
        logger.warn('Invalid API key attempt', { ip: req.ip });
        return res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid API key',
            },
        });
    }

    next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });

    next();
}; 