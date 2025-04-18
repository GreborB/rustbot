/**
 * Command execution service
 * @module commands
 */

import { logger } from './utils/logger.js';
import { RustPlus } from '@liamcottle/rustplus.js';
import { updateCommandStats } from './socketHandlers.js';

// State management
let rustPlus = null;

/**
 * Initialize Rust+ connection for commands
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
            logger.info('Connected to Rust server');
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
 * Execute a command
 * @param {string} command - Command name
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} - Command result
 */
async function executeCommand(command, args) {
    try {
        if (!rustPlus) {
            throw new Error('Not connected to Rust server');
        }

        let result;
        switch (command) {
            case 'getPlayerList':
                result = await rustPlus.getTeamInfo();
                break;
            case 'getPlayerInfo':
                result = await rustPlus.getEntityInfo(args.entityId);
                break;
            case 'getStorageContents':
                result = await rustPlus.getEntityInfo(args.entityId);
                break;
            case 'getVendingMachines':
                result = await rustPlus.getEntityInfo(args.entityId);
                break;
            case 'getSmartSwitches':
                result = await rustPlus.getEntityInfo(args.entityId);
                break;
            case 'getTimers':
                result = await rustPlus.getEntityInfo(args.entityId);
                break;
            default:
                throw new Error('Unknown command');
        }

        updateCommandStats(command, true);
        logger.info('Command executed successfully', { command, args });
        return result;
    } catch (error) {
        updateCommandStats(command, false);
        logger.error('Command execution failed:', error);
        throw new Error(`Failed to execute command: ${error.message}`);
    }
}

/**
 * Cleanup Rust+ connection
 * @returns {Promise<void>}
 */
async function cleanup() {
    try {
        if (rustPlus) {
            await rustPlus.disconnect();
            rustPlus = null;
            logger.info('Rust+ connection cleaned up');
        }
    } catch (error) {
        logger.error('Error cleaning up Rust+ connection:', error);
        throw new Error('Failed to cleanup Rust+ connection');
    }
}

export {
    initializeRustPlus,
    executeCommand,
    cleanup
}; 