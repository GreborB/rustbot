import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;
import config from './config.js';
import { logger } from './utils/logger.js';

// Constants
const PAIRING_CODE_LENGTH = 4;
const PAIRING_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_PAIRING_ATTEMPTS = 3;
const PAIRING_RATE_LIMIT = 5; // attempts per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// State management
let rustPlus = null;
let pairingInfo = null;
let pairingAttempts = 0;
let pairingRateLimits = new Map();
let cleanupTimeout = null;

/**
 * Validate server information
 * @param {Object} serverInfo - Server information to validate
 * @throws {Error} If validation fails
 */
function validateServerInfo(serverInfo) {
    if (!serverInfo) {
        throw new Error('No server information provided');
    }

    const requiredFields = ['ip', 'port', 'playerId', 'playerToken'];
    const missingFields = requiredFields.filter(field => !serverInfo[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(serverInfo.ip)) {
        throw new Error('Invalid IP address format');
    }

    if (typeof serverInfo.port !== 'number' || serverInfo.port < 1 || serverInfo.port > 65535) {
        throw new Error('Invalid port number');
    }
}

/**
 * Check pairing rate limit
 * @param {string} socketId - Socket ID
 * @returns {boolean} - Whether pairing is allowed
 */
function checkPairingRateLimit(socketId) {
    const now = Date.now();
    const attempts = pairingRateLimits.get(socketId) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    pairingRateLimits.set(socketId, recentAttempts);

    if (recentAttempts.length >= PAIRING_RATE_LIMIT) {
        return false;
    }

    recentAttempts.push(now);
    return true;
}

/**
 * Cleanup pairing state
 */
function cleanupPairingState() {
    if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
    }

    cleanupTimeout = setTimeout(() => {
        if (pairingInfo && Date.now() > pairingInfo.expires) {
            logger.info('Cleaning up expired pairing state');
            pairingInfo = null;
            pairingAttempts = 0;
        }
    }, PAIRING_CODE_EXPIRY);
}

/**
 * Initialize Rust+ connection
 * @param {string} ip - Server IP address
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
            rustPlus = null;
        }

        logger.info('Initializing new Rust+ connection', { ip, port });
        rustPlus = new RustPlus(ip, port, playerId, playerToken);
        
        rustPlus.on('connected', () => {
            logger.info('Connected to Rust server');
            pairingAttempts = 0;
        });

        rustPlus.on('disconnected', () => {
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
 * Start the pairing process
 * @param {string} socketId - Socket ID
 * @returns {Promise<string>} - Generated pairing code
 */
async function startPairing(socketId) {
    try {
        if (!checkPairingRateLimit(socketId)) {
            throw new Error('Too many pairing attempts. Please try again later.');
        }

        if (pairingInfo && Date.now() < pairingInfo.expires) {
            logger.warn('Pairing already in progress');
            return pairingInfo.code;
        }

        const code = Array.from({ length: PAIRING_CODE_LENGTH }, () => 
            Math.floor(Math.random() * 10)
        ).join('');

        pairingInfo = {
            code,
            timestamp: Date.now(),
            expires: Date.now() + PAIRING_CODE_EXPIRY,
            socketId
        };

        cleanupPairingState();
        logger.info('New pairing code generated', { code });
        return code;
    } catch (error) {
        logger.error('Error starting pairing:', error);
        throw error;
    }
}

/**
 * Verify pairing code
 * @param {string} code - Code to verify
 * @param {string} socketId - Socket ID
 * @returns {boolean} - Whether the code is valid
 */
function verifyPairingCode(code, socketId) {
    if (!pairingInfo) {
        logger.warn('No active pairing session');
        return false;
    }

    if (pairingInfo.socketId !== socketId) {
        logger.warn('Pairing code from different socket');
        return false;
    }

    if (Date.now() > pairingInfo.expires) {
        logger.warn('Pairing code expired');
        pairingInfo = null;
        return false;
    }

    const isValid = code === pairingInfo.code;
    if (!isValid) {
        pairingAttempts++;
        logger.warn('Invalid pairing code attempt', { attempts: pairingAttempts });
        
        if (pairingAttempts >= MAX_PAIRING_ATTEMPTS) {
            logger.warn('Max pairing attempts reached');
            pairingInfo = null;
            pairingAttempts = 0;
        }
    }

    return isValid;
}

/**
 * Get server information
 * @returns {Promise<Object>} - Server information
 */
async function getServerInfo() {
    try {
        if (!rustPlus) {
            throw new Error('Not connected to Rust server');
        }

        const info = await rustPlus.getInfo();
        logger.info('Retrieved server information');
        
        return {
            name: info.name,
            players: info.players,
            maxPlayers: info.maxPlayers,
            seed: info.seed,
            size: info.size,
            url: info.url
        };
    } catch (error) {
        logger.error('Error getting server info:', error);
        throw new Error('Failed to get server information');
    }
}

/**
 * Cleanup pairing module
 * @returns {Promise<void>}
 */
async function cleanup() {
    try {
        if (cleanupTimeout) {
            clearTimeout(cleanupTimeout);
            cleanupTimeout = null;
        }

        if (rustPlus) {
            await rustPlus.disconnect();
            rustPlus = null;
        }

        pairingInfo = null;
        pairingAttempts = 0;
        pairingRateLimits.clear();
        
        logger.info('Pairing module cleaned up');
    } catch (error) {
        logger.error('Error cleaning up pairing module:', error);
        throw error;
    }
}

/**
 * Setup Socket.IO pairing handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupPairingHandlers(io) {
    io.on('connection', (socket) => {
        logger.info('New client connected', { socketId: socket.id });

        socket.on('startPairing', async () => {
            try {
                const code = await startPairing(socket.id);
                socket.emit('pairingCode', { code });
            } catch (error) {
                logger.error('Error in startPairing:', error);
                socket.emit('pairingError', { error: error.message });
            }
        });

        socket.on('verifyPairing', async (data) => {
            try {
                const { code, serverInfo } = data;
                
                validateServerInfo(serverInfo);
                
                if (!verifyPairingCode(code, socket.id)) {
                    socket.emit('pairingError', { error: 'Invalid or expired code' });
                    return;
                }

                await initializeRustPlus(
                    serverInfo.ip,
                    serverInfo.port,
                    serverInfo.playerId,
                    serverInfo.playerToken
                );

                socket.emit('pairingSuccess');
                logger.info('Pairing successful', { socketId: socket.id });
            } catch (error) {
                logger.error('Error in verifyPairing:', error);
                socket.emit('pairingError', { error: error.message });
            }
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected', { socketId: socket.id });
            pairingRateLimits.delete(socket.id);
        });
    });
}

export { setupPairingHandlers, getServerInfo, cleanup }; 