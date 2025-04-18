/**
 * Authentication service
 * @module auth
 */

import { logger } from './utils/logger.js';
import config from './config.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

// State management
let rustPlus = null;
let isAuthenticated = false;
let authToken = null;

/**
 * Initialize Rust+ connection for authentication
 * @param {string} ip - Server IP
 * @param {number} port - Server port
 * @param {string} playerId - Player ID
 * @param {string} playerToken - Player token
 * @returns {Promise<void>}
 */
async function initializeRustPlus(ip, port, playerId, playerToken) {
    try {
        if (rustPlus) {
            logger.info('Disconnecting existing Rust+ connection');
            await rustPlus.disconnect();
        }

        logger.info('Initializing new Rust+ connection', { ip, port });
        rustPlus = new RustPlus(ip, port, playerId, playerToken);
        
        rustPlus.on('connected', () => {
            isAuthenticated = true;
            logger.info('Connected to Rust server');
        });

        rustPlus.on('disconnected', () => {
            isAuthenticated = false;
            logger.warn('Disconnected from Rust server');
        });

        rustPlus.on('error', (error) => {
            logger.error('Rust+ error:', error);
        });

        await rustPlus.connect();
        logger.info('Rust+ connection established');
    } catch (error) {
        logger.error('Failed to initialize Rust+ connection:', error);
        throw new Error('Failed to connect to Rust server');
    }
}

/**
 * Authenticate with server
 * @param {string} ip - Server IP
 * @param {number} port - Server port
 * @param {string} playerId - Player ID
 * @param {string} playerToken - Player token
 * @returns {Promise<string>} - Authentication token
 */
async function authenticate(ip, port, playerId, playerToken) {
    try {
        await initializeRustPlus(ip, port, playerId, playerToken);
        authToken = generateAuthToken();
        logger.info('Authentication successful', { playerId });
        return authToken;
    } catch (error) {
        logger.error('Authentication failed:', error);
        throw new Error('Failed to authenticate');
    }
}

/**
 * Generate authentication token
 * @returns {string} - Generated token
 */
function generateAuthToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
}

/**
 * Verify authentication token
 * @param {string} token - Token to verify
 * @returns {boolean} - Whether the token is valid
 */
function verifyToken(token) {
    if (!authToken || !token) {
        return false;
    }
    return token === authToken;
}

/**
 * Check authentication status
 * @returns {boolean} - Whether the user is authenticated
 */
function isAuth() {
    return isAuthenticated && authToken !== null;
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
async function logout() {
    try {
        if (rustPlus) {
            await rustPlus.disconnect();
            rustPlus = null;
        }
        isAuthenticated = false;
        authToken = null;
        logger.info('User logged out');
    } catch (error) {
        logger.error('Error during logout:', error);
        throw new Error('Failed to logout');
    }
}

export {
    authenticate,
    verifyToken,
    isAuth,
    logout,
    initializeRustPlus
}; 