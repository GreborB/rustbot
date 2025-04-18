import { RustPlus } from '@liamcottle/rustplus.js';
import config from './config.js';
import { logger } from './utils/logger.js';

// Constants
const PAIRING_CODE_LENGTH = 4;
const PAIRING_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_PAIRING_ATTEMPTS = 3;

// State management
let rustPlus = null;
let pairingInfo = null;
let pairingAttempts = 0;

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
 * @returns {Promise<string>} - Generated pairing code
 */
async function startPairing() {
    try {
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
            expires: Date.now() + PAIRING_CODE_EXPIRY
        };

        logger.info('New pairing code generated', { code });
        return code;
    } catch (error) {
        logger.error('Error starting pairing:', error);
        throw new Error('Failed to start pairing process');
    }
}

/**
 * Verify pairing code
 * @param {string} code - Code to verify
 * @returns {boolean} - Whether the code is valid
 */
function verifyPairingCode(code) {
    if (!pairingInfo) {
        logger.warn('No active pairing session');
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
 * Setup Socket.IO pairing handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupPairingHandlers(io) {
    io.on('connection', (socket) => {
        logger.info('New client connected', { socketId: socket.id });

        socket.on('startPairing', async () => {
            try {
                const code = await startPairing();
                socket.emit('pairingCode', { code });
            } catch (error) {
                logger.error('Error in startPairing:', error);
                socket.emit('pairingError', { error: error.message });
            }
        });

        socket.on('verifyPairing', async (data) => {
            try {
                const { code, serverInfo } = data;
                
                if (!verifyPairingCode(code)) {
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
        });
    });
}

export { setupPairingHandlers, getServerInfo }; 