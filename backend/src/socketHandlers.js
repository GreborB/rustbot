/**
 * Socket.IO handlers
 * @module socketHandlers
 */

import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;
import { loggerInstance as logger } from './utils/logger.js';
import config from './config.js';
import { verifyToken } from './auth.js';
import { EventEmitter } from 'events';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { v4 as uuidv4 } from 'uuid';

// Socket configuration
const SOCKET_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 5000, // 5 seconds
    COMMAND_RATE_LIMIT: 10, // commands per minute
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    STATS_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    AUTH_TIMEOUT: 30 * 1000, // 30 seconds
    MAX_SOCKETS: 100,
    MAX_COMMANDS_PER_SOCKET: 1000,
    MAX_ERRORS_PER_SOCKET: 10,
    ERROR_RESET_INTERVAL: 60 * 60 * 1000, // 1 hour
    PING_INTERVAL: 30 * 1000, // 30 seconds
    PING_TIMEOUT: 10 * 1000, // 10 seconds
    MAX_PING_FAILURES: 3,
    COMMAND_TIMEOUT: 10 * 1000, // 10 seconds
    MAX_BATCH_SIZE: 10,
    BATCH_TIMEOUT: 5 * 1000, // 5 seconds
    MAX_MESSAGE_SIZE: '1mb',
    CORS_ORIGIN: '*',
    TRANSPORTS: ['websocket', 'polling'],
    ALLOW_UPGRADES: true,
    PER_MESSAGE_DEFLATE: true,
    HTTP_COMPRESSION: true,
    COOKIE: false,
    SAME_SITE: 'strict',
    PATH: '/socket.io',
    CONNECT_TIMEOUT: 45000,
    ACK_TIMEOUT: 10000,
    PING_TIMEOUT: 60000,
    PING_INTERVAL: 25000,
    UPGRADE_TIMEOUT: 10000,
    MAX_HTTP_BUFFER_SIZE: '1mb',
    ALLOW_REQUEST: true,
    ALLOW_HEADERS: ['content-type', 'authorization'],
    ALLOW_CREDENTIALS: true,
    ALLOW_METHODS: ['GET', 'POST'],
    ALLOW_STATUS: [200, 401, 403, 404, 500],
    // New configuration options
    MAX_CONCURRENT_COMMANDS: 5,
    COMMAND_QUEUE_SIZE: 100,
    COMMAND_RETRY_ATTEMPTS: 3,
    COMMAND_RETRY_DELAY: 1000,
    SOCKET_METADATA_LIMIT: 1024, // 1KB
    MAX_SOCKET_GROUPS: 5,
    GROUP_NAME_MAX_LENGTH: 32,
    MAX_SOCKETS_PER_GROUP: 20,
    SOCKET_HISTORY_LIMIT: 100,
    HISTORY_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_SOCKET_NOTES: 10,
    NOTE_MAX_LENGTH: 500,
    MAX_SOCKET_ALERTS: 20,
    ALERT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_SOCKET_PERMISSIONS: 5,
    PERMISSION_TYPES: ['read', 'write', 'admin'],
    DEFAULT_PERMISSION: 'read',
    MAX_SOCKET_SHARES: 10,
    SHARE_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
    SOCKET_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_BACKUP_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_STATS_INTERVAL: 60 * 60 * 1000, // 1 hour
    MAX_STATS_HISTORY: 30 * 24, // 30 days
    SOCKET_EVENTS_LIMIT: 1000,
    EVENT_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_EVENT_TYPES: 20,
    EVENT_TYPE_MAX_LENGTH: 32,
    MAX_EVENT_DATA_SIZE: 1024, // 1KB
    SOCKET_LOGS_LIMIT: 1000,
    LOG_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_LOG_LEVELS: ['debug', 'info', 'warn', 'error', 'critical'],
    DEFAULT_LOG_LEVEL: 'info',
    MAX_LOG_MESSAGE_LENGTH: 500,
    SOCKET_SETTINGS_LIMIT: 1024, // 1KB
    SETTINGS_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_SETTING_NAME_LENGTH: 64,
    MAX_SETTING_VALUE_LENGTH: 256,
    SOCKET_FIRMWARE_LIMIT: 10 * 1024 * 1024, // 10MB
    FIRMWARE_UPDATE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_FIRMWARE_VERSIONS: 5,
    FIRMWARE_BACKUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 days
    SOCKET_NETWORK_LIMIT: 5,
    NETWORK_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_NETWORK_NAME_LENGTH: 32,
    MAX_NETWORK_PASSWORD_LENGTH: 64,
    SOCKET_LOCATION_LIMIT: 10,
    LOCATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_LOCATION_NAME_LENGTH: 64,
    MAX_LOCATION_DESCRIPTION_LENGTH: 256,
    SOCKET_SCHEDULE_LIMIT: 20,
    SCHEDULE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_SCHEDULE_NAME_LENGTH: 64,
    MAX_SCHEDULE_DESCRIPTION_LENGTH: 256,
    SOCKET_SCENE_LIMIT: 10,
    SCENE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_SCENE_NAME_LENGTH: 64,
    MAX_SCENE_DESCRIPTION_LENGTH: 256,
    MAX_SCENE_ACTIONS: 20,
    SOCKET_AUTOMATION_LIMIT: 20,
    AUTOMATION_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_AUTOMATION_NAME_LENGTH: 64,
    MAX_AUTOMATION_DESCRIPTION_LENGTH: 256,
    MAX_AUTOMATION_TRIGGERS: 10,
    MAX_AUTOMATION_ACTIONS: 10,
    SOCKET_INTEGRATION_LIMIT: 10,
    INTEGRATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_INTEGRATION_NAME_LENGTH: 64,
    MAX_INTEGRATION_DESCRIPTION_LENGTH: 256,
    MAX_INTEGRATION_SETTINGS: 20,
    SOCKET_BACKUP_LIMIT: 5,
    BACKUP_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_BACKUP_NAME_LENGTH: 64,
    MAX_BACKUP_DESCRIPTION_LENGTH: 256,
    MAX_BACKUP_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_RESTORE_LIMIT: 5,
    RESTORE_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_RESTORE_NAME_LENGTH: 64,
    MAX_RESTORE_DESCRIPTION_LENGTH: 256,
    MAX_RESTORE_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_MIGRATION_LIMIT: 5,
    MIGRATION_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_MIGRATION_NAME_LENGTH: 64,
    MAX_MIGRATION_DESCRIPTION_LENGTH: 256,
    MAX_MIGRATION_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_SYNC_LIMIT: 5,
    SYNC_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_SYNC_NAME_LENGTH: 64,
    MAX_SYNC_DESCRIPTION_LENGTH: 256,
    MAX_SYNC_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_UPDATE_LIMIT: 5,
    UPDATE_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_UPDATE_NAME_LENGTH: 64,
    MAX_UPDATE_DESCRIPTION_LENGTH: 256,
    MAX_UPDATE_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_DOWNLOAD_LIMIT: 5,
    DOWNLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_DOWNLOAD_NAME_LENGTH: 64,
    MAX_DOWNLOAD_DESCRIPTION_LENGTH: 256,
    MAX_DOWNLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_UPLOAD_LIMIT: 5,
    UPLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_UPLOAD_NAME_LENGTH: 64,
    MAX_UPLOAD_DESCRIPTION_LENGTH: 256,
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_EXPORT_LIMIT: 5,
    EXPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_EXPORT_NAME_LENGTH: 64,
    MAX_EXPORT_DESCRIPTION_LENGTH: 256,
    MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_IMPORT_LIMIT: 5,
    IMPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_IMPORT_NAME_LENGTH: 64,
    MAX_IMPORT_DESCRIPTION_LENGTH: 256,
    MAX_IMPORT_SIZE: 10 * 1024 * 1024, // 10MB
    SOCKET_BACKUP_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    SOCKET_LOG_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    SOCKET_EVENT_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    SOCKET_STATS_RETENTION: 90 * 24 * 60 * 60 * 1000, // 90 days
    SOCKET_ALERT_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    SOCKET_HISTORY_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    SOCKET_SETTINGS_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_FIRMWARE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_NETWORK_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_LOCATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_SCHEDULE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_SCENE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_AUTOMATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_INTEGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_BACKUP_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_RESTORE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_MIGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_SYNC_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_UPDATE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_DOWNLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_UPLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_EXPORT_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    SOCKET_IMPORT_RETENTION: 365 * 24 * 60 * 60 * 1000 // 365 days
};

/**
 * Socket manager class for handling real-time communication
 */
class SocketManager extends EventEmitter {
    constructor() {
        super();
        this.rustPlus = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.commandStats = new Map();
        this.commandRateLimits = new Map();
        this.reconnectTimeout = null;
        this.statsCleanupInterval = null;
        this.authenticatedSockets = new Set();
        this.socketErrors = new Map();
        this.socketPings = new Map();
        this.socketCommands = new Map();
        this.errorResetInterval = null;
        this.pingInterval = null;
        this.commandTimeouts = new Map();
        this.batchQueues = new Map();
        this.socketMetadata = new Map();
        this.io = null;
        this.rateLimiter = new RateLimiterMemory({
            points: SOCKET_CONFIG.COMMAND_RATE_LIMIT,
            duration: SOCKET_CONFIG.RATE_LIMIT_WINDOW / 1000
        });
        this.commandQueue = new Map();
        this.socketGroups = new Map();
        this.socketHistory = new Map();
        this.socketStats = new Map();
        this.socketEvents = new Map();
        this.socketLogs = new Map();
        this.socketSettings = new Map();
        this.socketFirmware = new Map();
        this.socketNetwork = new Map();
        this.socketLocation = new Map();
        this.socketSchedule = new Map();
        this.socketScene = new Map();
        this.socketAutomation = new Map();
        this.socketIntegration = new Map();
        this.socketBackup = new Map();
        this.socketRestore = new Map();
        this.socketMigration = new Map();
        this.socketSync = new Map();
        this.socketUpdate = new Map();
        this.socketDownload = new Map();
        this.socketUpload = new Map();
        this.socketExport = new Map();
        this.socketImport = new Map();
        this.cleanupIntervals = new Map();
        this.initializeCleanupIntervals();
    }

    /**
     * Initialize cleanup intervals
     */
    initializeCleanupIntervals() {
        // Command stats cleanup
        this.cleanupIntervals.set('stats', setInterval(
            () => this.cleanupCommandStats(),
            SOCKET_CONFIG.STATS_CLEANUP_INTERVAL
        ));

        // Socket errors reset
        this.cleanupIntervals.set('errors', setInterval(
            () => this.resetSocketErrors(),
            SOCKET_CONFIG.ERROR_RESET_INTERVAL
        ));

        // Socket pings
        this.cleanupIntervals.set('pings', setInterval(
            () => this.checkSocketPings(),
            SOCKET_CONFIG.PING_INTERVAL
        ));

        // History cleanup
        this.cleanupIntervals.set('history', setInterval(
            () => this.cleanupSocketHistory(),
            SOCKET_CONFIG.HISTORY_CLEANUP_INTERVAL
        ));

        // Events cleanup
        this.cleanupIntervals.set('events', setInterval(
            () => this.cleanupSocketEvents(),
            SOCKET_CONFIG.EVENT_CLEANUP_INTERVAL
        ));

        // Logs cleanup
        this.cleanupIntervals.set('logs', setInterval(
            () => this.cleanupSocketLogs(),
            SOCKET_CONFIG.LOG_CLEANUP_INTERVAL
        ));
    }

    /**
     * Validate socket data
     * @param {Object} data - Data to validate
     * @param {Array<string>} requiredFields - Required fields
     * @throws {Error} If validation fails
     */
    validateSocketData(data, requiredFields) {
        if (!data) {
            throw new Error('No data provided');
        }

        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Validate command data
     * @param {string} command - Command name
     * @param {Object} data - Command data
     * @throws {Error} If validation fails
     */
    validateCommandData(command, data) {
        switch (command) {
            case 'initializeRustPlus':
                this.validateSocketData(data, ['ip', 'port', 'playerId', 'playerToken']);
                if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(data.ip)) {
                    throw new Error('Invalid IP address format');
                }
                if (typeof data.port !== 'number' || data.port < 1 || data.port > 65535) {
                    throw new Error('Invalid port number');
                }
                break;
            case 'getCommandStats':
                // No additional validation needed
                break;
            case 'executeBatch':
                this.validateSocketData(data, ['commands']);
                if (!Array.isArray(data.commands)) {
                    throw new Error('Commands must be an array');
                }
                if (data.commands.length > SOCKET_CONFIG.MAX_BATCH_SIZE) {
                    throw new Error(`Batch size exceeds maximum of ${SOCKET_CONFIG.MAX_BATCH_SIZE}`);
                }
                break;
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    }

    /**
     * Check command rate limit
     * @param {string} command - Command name
     * @param {string} socketId - Socket ID
     * @returns {Promise<boolean>} - Whether command is allowed
     */
    async checkRateLimit(command, socketId) {
        try {
            const key = `${command}:${socketId}`;
            const now = Date.now();
            const limit = this.commandRateLimits.get(key) || [];
            const socketCommands = this.socketCommands.get(socketId) || 0;

            // Check socket command limit
            if (socketCommands >= SOCKET_CONFIG.MAX_COMMANDS_PER_SOCKET) {
                logger.warn('Socket command limit reached', { socketId });
                return false;
            }

            // Remove old entries
            const recentCommands = limit.filter(time => now - time < SOCKET_CONFIG.RATE_LIMIT_WINDOW);
            this.commandRateLimits.set(key, recentCommands);

            if (recentCommands.length >= SOCKET_CONFIG.COMMAND_RATE_LIMIT) {
                return false;
            }

            // Check rate limiter
            try {
                await this.rateLimiter.consume(key);
            } catch (error) {
                logger.warn('Rate limit exceeded', { command, socketId });
                return false;
            }

            recentCommands.push(now);
            this.socketCommands.set(socketId, socketCommands + 1);
            return true;
        } catch (error) {
            logger.error('Error checking rate limit:', error);
            return false;
        }
    }

    /**
     * Check socket authentication
     * @param {string} socketId - Socket ID
     * @returns {boolean} - Whether socket is authenticated
     */
    isSocketAuthenticated(socketId) {
        return this.authenticatedSockets.has(socketId);
    }

    /**
     * Track socket error
     * @param {string} socketId - Socket ID
     * @returns {boolean} - Whether socket should be disconnected
     */
    trackSocketError(socketId) {
        const errors = this.socketErrors.get(socketId) || 0;
        this.socketErrors.set(socketId, errors + 1);

        if (errors + 1 >= SOCKET_CONFIG.MAX_ERRORS_PER_SOCKET) {
            logger.warn('Socket error limit reached', { socketId });
            return true;
        }

        return false;
    }

    /**
     * Reset socket error count
     */
    resetSocketErrors() {
        this.socketErrors.clear();
        logger.info('Socket errors reset');
    }

    /**
     * Track socket ping
     * @param {string} socketId - Socket ID
     * @returns {boolean} - Whether socket should be disconnected
     */
    trackSocketPing(socketId) {
        const pings = this.socketPings.get(socketId) || { failures: 0, lastPing: Date.now() };
        
        if (Date.now() - pings.lastPing > SOCKET_CONFIG.PING_TIMEOUT) {
            pings.failures++;
            if (pings.failures >= SOCKET_CONFIG.MAX_PING_FAILURES) {
                logger.warn('Socket ping failures limit reached', { socketId });
                return true;
            }
        } else {
            pings.failures = 0;
        }

        pings.lastPing = Date.now();
        this.socketPings.set(socketId, pings);
        return false;
    }

    /**
     * Check socket pings
     */
    checkSocketPings() {
        const now = Date.now();
        for (const [socketId, pings] of this.socketPings.entries()) {
            if (now - pings.lastPing > SOCKET_CONFIG.PING_TIMEOUT) {
                pings.failures++;
                if (pings.failures >= SOCKET_CONFIG.MAX_PING_FAILURES) {
                    logger.warn('Socket ping failures limit reached', { socketId });
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect();
                    }
                }
            }
        }
    }

    /**
     * Initialize Rust+ client with reconnection
     * @param {string} ip - Server IP
     * @param {number} port - Server port
     * @param {string} playerId - Player ID
     * @param {string} playerToken - Player token
     * @returns {Promise<void>}
     */
    async initializeRustPlus(ip, port, playerId, playerToken) {
        try {
            if (this.rustPlus) {
                logger.info('Disconnecting existing Rust+ connection');
                await this.rustPlus.disconnect();
                this.rustPlus = null;
            }

            logger.info('Initializing new Rust+ connection', { ip, port });
            this.rustPlus = new RustPlus(ip, port, playerId, playerToken);
            
            this.rustPlus.on('connected', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
                logger.info('Connected to Rust server');
                this.emit('rustConnected');
            });

            this.rustPlus.on('disconnected', () => {
                this.isConnected = false;
                logger.warn('Disconnected from Rust server');
                this.emit('rustDisconnected');
                this.attemptReconnect(ip, port, playerId, playerToken);
            });

            this.rustPlus.on('error', (error) => {
                logger.error('Rust+ error:', error);
                this.emit('rustError', error);
            });

            await this.rustPlus.connect();
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw error;
        }
    }

    /**
     * Attempt to reconnect to Rust server
     * @param {string} ip - Server IP
     * @param {number} port - Server port
     * @param {string} playerId - Player ID
     * @param {string} playerToken - Player token
     */
    attemptReconnect(ip, port, playerId, playerToken) {
        if (this.reconnectAttempts >= SOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Maximum reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${SOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})`);

        this.reconnectTimeout = setTimeout(async () => {
            try {
                await this.initializeRustPlus(ip, port, playerId, playerToken);
            } catch (error) {
                logger.error('Reconnection failed:', error);
                this.attemptReconnect(ip, port, playerId, playerToken);
            }
        }, SOCKET_CONFIG.RECONNECT_DELAY);
    }

    /**
     * Update command statistics
     * @param {string} command - Command name
     * @param {boolean} success - Whether command was successful
     */
    updateCommandStats(command, success) {
        const stats = this.commandStats.get(command) || { total: 0, success: 0, error: 0 };
        stats.total++;
        if (success) {
            stats.success++;
        } else {
            stats.error++;
        }
        this.commandStats.set(command, stats);
    }

    /**
     * Clean up command statistics
     */
    cleanupCommandStats() {
        const now = Date.now();
        for (const [command, stats] of this.commandStats.entries()) {
            if (now - stats.lastUpdated > SOCKET_CONFIG.STATS_CLEANUP_INTERVAL) {
                this.commandStats.delete(command);
            }
        }
    }

    /**
     * Get command statistics
     * @returns {Object} Command statistics
     */
    getCommandStats() {
        const stats = {};
        for (const [command, data] of this.commandStats.entries()) {
            stats[command] = {
                total: data.total,
                success: data.success,
                error: data.error,
                successRate: data.total > 0 ? (data.success / data.total) * 100 : 0
            };
        }
        return stats;
    }

    /**
     * Clean up Rust+ resources
     */
    async cleanupRustPlus() {
        if (this.rustPlus) {
            try {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
                this.isConnected = false;
                logger.info('Rust+ connection cleaned up');
            } catch (error) {
                logger.error('Error cleaning up Rust+ connection:', error);
            }
        }
    }

    /**
     * Set up socket handlers
     * @param {SocketIO.Server} io - Socket.IO server instance
     */
    setupSocketHandlers(io) {
        this.io = io;

        io.on('connection', (socket) => {
            logger.info('New socket connection', { socketId: socket.id });

            // Initialize socket metadata
            this.socketMetadata.set(socket.id, {
                connectedAt: Date.now(),
                lastSeen: Date.now(),
                status: 'connected',
                errors: 0,
                commands: 0
            });

            // Handle authentication
            socket.on('authenticate', async (data) => {
                try {
                    this.validateSocketData(data, ['token']);
                    const isValid = await verifyToken(data.token);
                    if (isValid) {
                        this.authenticatedSockets.add(socket.id);
                        socket.emit('authenticated');
                        logger.info('Socket authenticated', { socketId: socket.id });
                    } else {
                        socket.emit('error', { message: 'Authentication failed' });
                        socket.disconnect();
                    }
                } catch (error) {
                    logger.error('Authentication error:', error);
                    socket.emit('error', { message: 'Authentication error' });
                    socket.disconnect();
                }
            });

            // Handle commands
            socket.on('command', async (data) => {
                try {
                    if (!this.isSocketAuthenticated(socket.id)) {
                        throw new Error('Socket not authenticated');
                    }

                    this.validateSocketData(data, ['command']);
                    const { command, ...commandData } = data;

                    // Check rate limit
                    const isAllowed = await this.checkRateLimit(command, socket.id);
                    if (!isAllowed) {
                        throw new Error('Rate limit exceeded');
                    }

                    // Execute command
                    const result = await this.executeCommand(command, commandData);
                    socket.emit('commandResult', { command, success: true, result });
                } catch (error) {
                    logger.error('Command error:', error);
                    socket.emit('commandResult', { command: data.command, success: false, error: error.message });
                    if (this.trackSocketError(socket.id)) {
                        socket.disconnect();
                    }
                }
            });

            // Handle batch commands
            socket.on('batch', async (data) => {
                try {
                    if (!this.isSocketAuthenticated(socket.id)) {
                        throw new Error('Socket not authenticated');
                    }

                    this.validateSocketData(data, ['commands']);
                    const { commands } = data;

                    // Check rate limit for each command
                    for (const cmd of commands) {
                        const isAllowed = await this.checkRateLimit(cmd.command, socket.id);
                        if (!isAllowed) {
                            throw new Error(`Rate limit exceeded for command: ${cmd.command}`);
                        }
                    }

                    // Execute commands
                    const results = await Promise.all(
                        commands.map(cmd => this.executeCommand(cmd.command, cmd.data))
                    );

                    socket.emit('batchResult', { success: true, results });
                } catch (error) {
                    logger.error('Batch command error:', error);
                    socket.emit('batchResult', { success: false, error: error.message });
                    if (this.trackSocketError(socket.id)) {
                        socket.disconnect();
                    }
                }
            });

            // Handle ping
            socket.on('ping', () => {
                socket.emit('pong');
                this.trackSocketPing(socket.id);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                logger.info('Socket disconnected', { socketId: socket.id });
                this.authenticatedSockets.delete(socket.id);
                this.socketMetadata.delete(socket.id);
                this.socketErrors.delete(socket.id);
                this.socketPings.delete(socket.id);
                this.socketCommands.delete(socket.id);
            });
        });
    }

    /**
     * Execute command
     * @param {string} command - Command name
     * @param {Object} data - Command data
     * @returns {Promise<any>} Command result
     */
    async executeCommand(command, data) {
        try {
            this.validateCommandData(command, data);

            switch (command) {
                case 'initializeRustPlus':
                    await this.initializeRustPlus(data.ip, data.port, data.playerId, data.playerToken);
                    return { success: true };
                case 'getCommandStats':
                    return this.getCommandStats();
                case 'executeBatch':
                    return await Promise.all(data.commands.map(cmd => this.executeCommand(cmd.command, cmd.data)));
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
        } catch (error) {
            logger.error('Command execution error:', error);
            throw error;
        }
    }

    /**
     * Initialize socket manager
     */
    async initialize() {
        try {
            this.initializeCleanupIntervals();
            logger.info('Socket manager initialized');
        } catch (error) {
            logger.error('Failed to initialize socket manager:', error);
            throw error;
        }
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            // Clear all intervals
            for (const interval of this.cleanupIntervals.values()) {
                clearInterval(interval);
            }
            this.cleanupIntervals.clear();

            // Clean up Rust+ connection
            await this.cleanupRustPlus();

            // Clear all collections
            this.commandStats.clear();
            this.commandRateLimits.clear();
            this.authenticatedSockets.clear();
            this.socketErrors.clear();
            this.socketPings.clear();
            this.socketCommands.clear();
            this.commandTimeouts.clear();
            this.batchQueues.clear();
            this.socketMetadata.clear();
            this.socketGroups.clear();
            this.socketHistory.clear();
            this.socketStats.clear();
            this.socketEvents.clear();
            this.socketLogs.clear();
            this.socketSettings.clear();
            this.socketFirmware.clear();
            this.socketNetwork.clear();
            this.socketLocation.clear();
            this.socketSchedule.clear();
            this.socketScene.clear();
            this.socketAutomation.clear();
            this.socketIntegration.clear();
            this.socketBackup.clear();
            this.socketRestore.clear();
            this.socketMigration.clear();
            this.socketSync.clear();
            this.socketUpdate.clear();
            this.socketDownload.clear();
            this.socketUpload.clear();
            this.socketExport.clear();
            this.socketImport.clear();

            logger.info('Socket manager cleaned up');
        } catch (error) {
            logger.error('Error cleaning up socket manager:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const socketManager = new SocketManager();
export default socketManager; 