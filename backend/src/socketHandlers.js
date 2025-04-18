/**
 * Socket.IO handlers
 * @module socketHandlers
 */

import { RustPlus } from '@liamcottle/rustplus.js';
import { logger } from './utils/logger.js';
import config from './config.js';

// State management
let rustPlus = null;
let isConnected = false;
let reconnectAttempts = 0;
let commandStats = new Map();

/**
 * Initialize Rust+ client
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
            isConnected = true;
            reconnectAttempts = 0;
            logger.info('Connected to Rust server');
        });

        rustPlus.on('disconnected', () => {
            isConnected = false;
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
 * Update command statistics
 * @param {string} command - Command name
 * @param {boolean} success - Whether the command was successful
 */
function updateCommandStats(command, success) {
    const stats = commandStats.get(command) || { total: 0, success: 0 };
    stats.total++;
    if (success) stats.success++;
    commandStats.set(command, stats);
    logger.debug('Command stats updated', { command, stats });
}

/**
 * Get command statistics
 * @returns {Object} - Command statistics
 */
function getCommandStats() {
    return Object.fromEntries(commandStats);
}

/**
 * Cleanup Rust+ client
 * @returns {Promise<void>}
 */
async function cleanupRustPlus() {
    try {
        if (rustPlus) {
            await rustPlus.disconnect();
            rustPlus = null;
            isConnected = false;
            logger.info('Rust+ connection cleaned up');
        }
    } catch (error) {
        logger.error('Error cleaning up Rust+ connection:', error);
        throw new Error('Failed to cleanup Rust+ connection');
    }
}

/**
 * Setup socket handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger.info('Client connected', { socketId: socket.id });

        socket.on('initializeRustPlus', async (data) => {
            try {
                const { ip, port, playerId, playerToken } = data;
                await initializeRustPlus(ip, port, playerId, playerToken);
                socket.emit('rustPlusInitialized', { success: true });
            } catch (error) {
                logger.error('Error initializing Rust+:', error);
                socket.emit('rustPlusError', { error: error.message });
            }
        });

        socket.on('getCommandStats', () => {
            try {
                const stats = getCommandStats();
                socket.emit('commandStats', stats);
            } catch (error) {
                logger.error('Error getting command stats:', error);
                socket.emit('error', { error: error.message });
            }
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected', { socketId: socket.id });
        });
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
        logger.info('Server shutting down');
        await cleanupRustPlus();
        process.exit(0);
    });
}

export { setupSocketHandlers, initializeRustPlus, cleanupRustPlus, updateCommandStats, getCommandStats }; 