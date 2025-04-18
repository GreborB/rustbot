/**
 * Command execution service
 * @module commands
 */

import { loggerInstance as logger } from './utils/logger.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;
import { updateCommandStats } from './socketHandlers.js';

// Command configuration
const COMMAND_CONFIG = {
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 5000,
    COMMAND_TIMEOUT: 10000,
    MAX_BATCH_SIZE: 10
};

// Command definitions with validation rules
const COMMANDS = {
    getPlayerList: {
        requiresConnection: true,
        validate: () => true, // No args needed
        execute: async (rustPlus) => rustPlus.getTeamInfo()
    },
    getPlayerInfo: {
        requiresConnection: true,
        validate: (args) => {
            if (!args?.entityId || typeof args.entityId !== 'string') {
                throw new Error('Invalid entityId');
            }
            return true;
        },
        execute: async (rustPlus, args) => rustPlus.getEntityInfo(args.entityId)
    },
    getStorageContents: {
        requiresConnection: true,
        validate: (args) => {
            if (!args?.entityId || typeof args.entityId !== 'string') {
                throw new Error('Invalid entityId');
            }
            return true;
        },
        execute: async (rustPlus, args) => rustPlus.getEntityInfo(args.entityId)
    },
    getVendingMachines: {
        requiresConnection: true,
        validate: (args) => {
            if (!args?.entityId || typeof args.entityId !== 'string') {
                throw new Error('Invalid entityId');
            }
            return true;
        },
        execute: async (rustPlus, args) => rustPlus.getEntityInfo(args.entityId)
    },
    getSmartSwitches: {
        requiresConnection: true,
        validate: (args) => {
            if (!args?.entityId || typeof args.entityId !== 'string') {
                throw new Error('Invalid entityId');
            }
            return true;
        },
        execute: async (rustPlus, args) => rustPlus.getEntityInfo(args.entityId)
    },
    getTimers: {
        requiresConnection: true,
        validate: (args) => {
            if (!args?.entityId || typeof args.entityId !== 'string') {
                throw new Error('Invalid entityId');
            }
            return true;
        },
        execute: async (rustPlus, args) => rustPlus.getEntityInfo(args.entityId)
    }
};

class CommandManager {
    constructor() {
        this.rustPlus = null;
        this.connectionPromise = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Initialize Rust+ connection
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
            
            // Connect with retry mechanism
            await this.connectWithRetry();
            
            logger.info('Rust+ connection established successfully');
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
            logger.info('Connected to Rust server');
            this.reconnectAttempts = 0;
        });

        this.rustPlus.on('disconnected', () => {
            logger.warn('Disconnected from Rust server');
            this.handleDisconnect();
        });

        this.rustPlus.on('error', (error) => {
            logger.error('Rust+ error:', error);
            this.handleError(error);
        });
    }

    /**
     * Handle disconnection event
     */
    async handleDisconnect() {
        if (this.reconnectAttempts < COMMAND_CONFIG.RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${COMMAND_CONFIG.RECONNECT_ATTEMPTS})`);
            await this.connectWithRetry();
        } else {
            logger.error('Max reconnection attempts reached');
            await this.cleanup();
        }
    }

    /**
     * Handle connection error
     * @param {Error} error - Error object
     */
    async handleError(error) {
        logger.error('Connection error:', error);
        if (this.reconnectAttempts < COMMAND_CONFIG.RECONNECT_ATTEMPTS) {
            await this.handleDisconnect();
        }
    }

    /**
     * Connect to Rust+ server with retry mechanism
     * @returns {Promise<void>}
     */
    async connectWithRetry() {
        for (let i = 0; i < COMMAND_CONFIG.RECONNECT_ATTEMPTS; i++) {
            try {
                if (!this.rustPlus) return;
                await this.rustPlus.connect();
                return;
            } catch (error) {
                logger.error(`Connection attempt ${i + 1} failed:`, error);
                if (i < COMMAND_CONFIG.RECONNECT_ATTEMPTS - 1) {
                    logger.info(`Retrying in ${COMMAND_CONFIG.RECONNECT_DELAY}ms...`);
                    await new Promise(resolve => setTimeout(resolve, COMMAND_CONFIG.RECONNECT_DELAY));
                }
            }
        }
        throw new Error('Failed to connect after multiple attempts');
    }

    /**
     * Execute a command with timeout
     * @param {string} command - Command name
     * @param {Object} args - Command arguments
     * @returns {Promise<Object>} - Command result
     */
    async executeCommand(command, args) {
        try {
            // Validate command exists
            if (!COMMANDS[command]) {
                throw new Error(`Unknown command: ${command}`);
            }

            const commandDef = COMMANDS[command];

            // Check connection requirement
            if (commandDef.requiresConnection && !this.rustPlus) {
                throw new Error('Not connected to Rust server');
            }

            // Validate arguments
            if (!commandDef.validate(args)) {
                throw new Error('Invalid command arguments');
            }

            // Execute command with timeout
            const result = await Promise.race([
                commandDef.execute(this.rustPlus, args),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Command timed out')), COMMAND_CONFIG.COMMAND_TIMEOUT)
                )
            ]);

            // Update statistics
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
     * Execute multiple commands in batch
     * @param {Array<Object>} commands - Array of command objects
     * @returns {Promise<Array>} - Array of results
     */
    async executeBatch(commands) {
        if (!Array.isArray(commands) || commands.length > COMMAND_CONFIG.MAX_BATCH_SIZE) {
            throw new Error(`Invalid batch size. Maximum ${COMMAND_CONFIG.MAX_BATCH_SIZE} commands allowed.`);
        }

        const results = [];
        for (const { command, args } of commands) {
            try {
                const result = await this.executeCommand(command, args);
                results.push({ success: true, result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        return results;
    }

    /**
     * Cleanup Rust+ connection
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.rustPlus) {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
                this.reconnectAttempts = 0;
                logger.info('Rust+ connection cleaned up');
            }
        } catch (error) {
            logger.error('Error cleaning up Rust+ connection:', error);
            throw new Error('Failed to cleanup Rust+ connection');
        }
    }
}

// Create and export singleton instance
const commandManager = new CommandManager();
export default Object.freeze(commandManager); 