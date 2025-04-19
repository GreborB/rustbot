import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import config from '../config/config.js';

// Different rate limiters for different types of requests
export const loginLimiter = rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.maxLoginAttempts,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for successful logins
        return req.path === '/auth/login' && req.method === 'POST' && req.user;
    },
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
        throw new AppError('Too many login attempts, please try again later', 429);
    }
});

export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for authenticated users
        return req.user;
    },
    handler: (req, res) => {
        logger.warn(`API rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
        throw new AppError('Too many requests, please try again later', 429);
    }
});

// Special limiter for sensitive operations
export const sensitiveOperationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin users
        return req.user && req.user.role === 'admin';
    },
    handler: (req, res) => {
        logger.warn(`Sensitive operation rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
        throw new AppError('Too many sensitive operations attempted, please try again later', 429);
    }
}); 