/**
 * Authentication service
 * @module auth
 */

import { loggerInstance as logger } from './utils/logger.js';
import config from './config.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;
import crypto from 'crypto';

// Authentication configuration
const AUTH_CONFIG = {
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_WINDOW: 1 * 60 * 60 * 1000, // 1 hour
    MAX_AUTH_ATTEMPTS: 5, // per minute
    AUTH_RATE_WINDOW: 60 * 1000, // 1 minute
    TOKEN_LENGTH: 32,
    SALT_LENGTH: 16,
    HASH_ALGORITHM: 'sha256',
    HASH_ITERATIONS: 10000,
    HASH_KEYLEN: 64
};

class AuthManager {
    constructor() {
        this.rustPlus = null;
        this.isAuthenticated = false;
        this.authToken = null;
        this.authAttempts = new Map();
        this.refreshTimeout = null;
        this.sessionData = new Map();
    }

    /**
     * Check authentication rate limit
     * @param {string} ip - Client IP
     * @returns {boolean} - Whether authentication is allowed
     */
    checkAuthRateLimit(ip) {
        try {
            const now = Date.now();
            const attempts = this.authAttempts.get(ip) || [];
            
            // Remove old attempts
            const recentAttempts = attempts.filter(time => now - time < AUTH_CONFIG.AUTH_RATE_WINDOW);
            this.authAttempts.set(ip, recentAttempts);

            if (recentAttempts.length >= AUTH_CONFIG.MAX_AUTH_ATTEMPTS) {
                logger.warn(`Rate limit exceeded for IP: ${ip}`);
                return false;
            }

            recentAttempts.push(now);
            return true;
        } catch (error) {
            logger.error('Error checking auth rate limit:', error);
            return false;
        }
    }

    /**
     * Generate secure authentication token
     * @param {Object} sessionData - Additional session data
     * @returns {string} - Generated token
     */
    generateAuthToken(sessionData = {}) {
        try {
            const timestamp = Date.now();
            const salt = crypto.randomBytes(AUTH_CONFIG.SALT_LENGTH).toString('hex');
            const token = crypto.randomBytes(AUTH_CONFIG.TOKEN_LENGTH).toString('hex');
            const hash = crypto.pbkdf2Sync(
                token,
                salt,
                AUTH_CONFIG.HASH_ITERATIONS,
                AUTH_CONFIG.HASH_KEYLEN,
                AUTH_CONFIG.HASH_ALGORITHM
            ).toString('hex');

            const fullToken = `${timestamp}-${salt}-${hash}`;
            
            // Store session data
            this.sessionData.set(fullToken, {
                ...sessionData,
                timestamp,
                salt,
                hash
            });

            // Set token expiry
            setTimeout(() => {
                if (this.authToken === fullToken) {
                    logger.info('Auth token expired');
                    this.invalidateToken(fullToken);
                }
            }, AUTH_CONFIG.TOKEN_EXPIRY);

            return fullToken;
        } catch (error) {
            logger.error('Error generating auth token:', error);
            throw new Error('Failed to generate authentication token');
        }
    }

    /**
     * Invalidate a token
     * @param {string} token - Token to invalidate
     */
    invalidateToken(token) {
        this.authToken = null;
        this.isAuthenticated = false;
        this.sessionData.delete(token);
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }

    /**
     * Schedule token refresh
     * @param {string} token - Current token
     */
    scheduleTokenRefresh(token) {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        this.refreshTimeout = setTimeout(() => {
            if (this.authToken === token) {
                logger.info('Refreshing auth token');
                const sessionData = this.sessionData.get(token);
                if (sessionData) {
                    this.authToken = this.generateAuthToken(sessionData);
                }
            }
        }, AUTH_CONFIG.TOKEN_EXPIRY - AUTH_CONFIG.REFRESH_WINDOW);
    }

    /**
     * Initialize Rust+ connection for authentication
     * @param {Object} params - Connection parameters
     * @returns {Promise<void>}
     */
    async initializeRustPlus({ ip, port, playerId, playerToken }) {
        try {
            await this.cleanup();

            logger.info('Initializing new Rust+ connection', { ip, port });
            this.rustPlus = new RustPlus(ip, port, playerId, playerToken);
            
            // Set up event handlers
            this.setupEventHandlers();
            
            await this.rustPlus.connect();
            logger.info('Rust+ connection established');
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw new Error('Failed to connect to Rust server');
        }
    }

    /**
     * Set up event handlers for Rust+ connection
     */
    setupEventHandlers() {
        this.rustPlus.on('connected', () => {
            this.isAuthenticated = true;
            logger.info('Connected to Rust server');
        });

        this.rustPlus.on('disconnected', () => {
            this.isAuthenticated = false;
            logger.warn('Disconnected from Rust server');
        });

        this.rustPlus.on('error', (error) => {
            logger.error('Rust+ error:', error);
            this.isAuthenticated = false;
        });
    }

    /**
     * Authenticate with server
     * @param {Object} params - Authentication parameters
     * @returns {Promise<string>} - Authentication token
     */
    async authenticate({ ip, port, playerId, playerToken, clientIp, sessionData = {} }) {
        try {
            if (!this.checkAuthRateLimit(clientIp)) {
                throw new Error('Too many authentication attempts. Please try again later.');
            }

            await this.initializeRustPlus({ ip, port, playerId, playerToken });
            this.authToken = this.generateAuthToken(sessionData);
            this.scheduleTokenRefresh(this.authToken);
            
            logger.info('Authentication successful', { playerId });
            return this.authToken;
        } catch (error) {
            logger.error('Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Verify authentication token
     * @param {string} token - Token to verify
     * @returns {boolean} - Whether the token is valid
     */
    verifyToken(token) {
        try {
            if (!this.authToken || !token) {
                return false;
            }

            const [timestamp, salt, hash] = token.split('-');
            const tokenAge = Date.now() - parseInt(timestamp, 10);

            if (tokenAge > AUTH_CONFIG.TOKEN_EXPIRY) {
                logger.warn('Token expired');
                this.invalidateToken(token);
                return false;
            }

            if (tokenAge > AUTH_CONFIG.TOKEN_EXPIRY - AUTH_CONFIG.REFRESH_WINDOW) {
                logger.info('Token needs refresh');
                const sessionData = this.sessionData.get(token);
                if (sessionData) {
                    this.authToken = this.generateAuthToken(sessionData);
                    this.scheduleTokenRefresh(this.authToken);
                }
            }

            return token === this.authToken;
        } catch (error) {
            logger.error('Error verifying token:', error);
            return false;
        }
    }

    /**
     * Get session data for a token
     * @param {string} token - Authentication token
     * @returns {Object|null} - Session data or null if not found
     */
    getSessionData(token) {
        return this.sessionData.get(token) || null;
    }

    /**
     * Check authentication status
     * @returns {boolean} - Whether the user is authenticated
     */
    isAuth() {
        return this.isAuthenticated && this.authToken !== null;
    }

    /**
     * Cleanup auth module
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
                this.refreshTimeout = null;
            }

            if (this.rustPlus) {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
            }

            this.isAuthenticated = false;
            this.authToken = null;
            this.authAttempts.clear();
            this.sessionData.clear();
            
            logger.info('Auth module cleaned up');
        } catch (error) {
            logger.error('Error cleaning up auth module:', error);
            throw error;
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.cleanup();
            logger.info('User logged out');
        } catch (error) {
            logger.error('Error during logout:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const authManager = new AuthManager();
export default Object.freeze(authManager); 