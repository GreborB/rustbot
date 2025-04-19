/**
 * Socket.IO handlers
 * @module socketHandlers
 */

import logger from './utils/logger.js';
import config from './config.js';
import { verifyToken } from './utils/auth.js';
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
        // Set up cleanup intervals for various data types
        this.cleanupIntervals.set('stats', setInterval(() => this.cleanupCommandStats(), SOCKET_CONFIG.STATS_CLEANUP_INTERVAL));
        this.cleanupIntervals.set('errors', setInterval(() => this.resetSocketErrors(), SOCKET_CONFIG.ERROR_RESET_INTERVAL));
        this.cleanupIntervals.set('pings', setInterval(() => this.checkSocketPings(), SOCKET_CONFIG.PING_INTERVAL));
        this.cleanupIntervals.set('history', setInterval(() => this.cleanupHistory(), SOCKET_CONFIG.HISTORY_CLEANUP_INTERVAL));
        this.cleanupIntervals.set('events', setInterval(() => this.cleanupEvents(), SOCKET_CONFIG.EVENT_CLEANUP_INTERVAL));
        this.cleanupIntervals.set('logs', setInterval(() => this.cleanupLogs(), SOCKET_CONFIG.LOG_CLEANUP_INTERVAL));
    }

    /**
     * Validate socket data
     * @param {Object} data - The data to validate
     * @param {Array} requiredFields - Array of required field names
     * @returns {boolean} - Whether the data is valid
     */
    validateSocketData(data, requiredFields) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        return requiredFields.every(field => data.hasOwnProperty(field));
    }

    /**
     * Validate command data
     * @param {string} command - The command to validate
     * @param {Object} data - The command data to validate
     * @returns {boolean} - Whether the command data is valid
     */
    validateCommandData(command, data) {
        const commandValidators = {
            'connect': ['ip', 'port', 'playerId', 'playerToken'],
            'disconnect': [],
            'command': ['type', 'data'],
            'batch': ['commands'],
            'group': ['name', 'action', 'sockets'],
            'history': ['limit'],
            'stats': ['type', 'limit'],
            'event': ['type', 'data'],
            'log': ['level', 'message'],
            'setting': ['name', 'value'],
            'firmware': ['version', 'data'],
            'network': ['name', 'password'],
            'location': ['name', 'description'],
            'schedule': ['name', 'description', 'cron'],
            'scene': ['name', 'description', 'actions'],
            'automation': ['name', 'description', 'triggers', 'actions'],
            'integration': ['name', 'description', 'settings'],
            'backup': ['name', 'description'],
            'restore': ['name', 'description', 'data'],
            'migration': ['name', 'description', 'data'],
            'sync': ['name', 'description', 'data'],
            'update': ['name', 'description', 'data'],
            'download': ['name', 'description', 'url'],
            'upload': ['name', 'description', 'data'],
            'export': ['name', 'description', 'data'],
            'import': ['name', 'description', 'data']
        };

        if (!commandValidators[command]) {
            return false;
        }

        return this.validateSocketData(data, commandValidators[command]);
    }

    /**
     * Check rate limit for a command
     * @param {string} command - The command to check
     * @param {string} socketId - The socket ID
     * @returns {Promise<boolean>} - Whether the command is allowed
     */
    async checkRateLimit(command, socketId) {
        try {
            const key = `${command}:${socketId}`;
            await this.rateLimiter.consume(key);
            return true;
        } catch (error) {
            logger.warn('Rate limit exceeded', { command, socketId });
            return false;
        }
    }

    /**
     * Check if a socket is authenticated
     * @param {string} socketId - The socket ID
     * @returns {boolean} - Whether the socket is authenticated
     */
    isSocketAuthenticated(socketId) {
        return this.authenticatedSockets.has(socketId);
    }

    /**
     * Track socket error
     * @param {string} socketId - The socket ID
     */
    trackSocketError(socketId) {
        const errors = this.socketErrors.get(socketId) || 0;
        this.socketErrors.set(socketId, errors + 1);
    }

    /**
     * Reset socket errors
     */
    resetSocketErrors() {
        this.socketErrors.clear();
    }

    /**
     * Track socket ping
     * @param {string} socketId - The socket ID
     */
    trackSocketPing(socketId) {
        const pings = this.socketPings.get(socketId) || { count: 0, lastPing: Date.now() };
        pings.count++;
        pings.lastPing = Date.now();
        this.socketPings.set(socketId, pings);
    }

    /**
     * Check socket pings
     */
    checkSocketPings() {
        const now = Date.now();
        for (const [socketId, pings] of this.socketPings.entries()) {
            if (now - pings.lastPing > SOCKET_CONFIG.PING_TIMEOUT) {
                logger.warn('Socket ping timeout', { socketId });
                this.trackSocketError(socketId);
            }
        }
    }

    /**
     * Execute a command
     * @param {string} command - The command to execute
     * @param {Object} data - The command data
     * @returns {Promise<Object>} - The command result
     */
    async executeCommand(command, data) {
        if (!this.validateCommandData(command, data)) {
            throw new Error('Invalid command data');
        }

        // Add command execution logic here
        return { success: true, command, data };
    }

    /**
     * Setup socket handlers
     * @param {Object} io - Socket.IO instance
     */
    setupSocketHandlers(io) {
        this.io = io;

        io.on('connection', (socket) => {
            logger.info('New socket connection', { socketId: socket.id });

            // Authentication timeout
            const authTimeout = setTimeout(() => {
                if (!this.isSocketAuthenticated(socket.id)) {
                    logger.warn('Authentication timeout', { socketId: socket.id });
                    socket.disconnect();
                }
            }, SOCKET_CONFIG.AUTH_TIMEOUT);

            // Authentication handler
            socket.on('authenticate', async (token) => {
                try {
                    const decoded = await verifyToken(token);
                    this.authenticatedSockets.add(socket.id);
                    clearTimeout(authTimeout);
                    logger.info('Socket authenticated', { socketId: socket.id, userId: decoded.userId });
                    socket.emit('authenticated');
                } catch (error) {
                    logger.error('Authentication failed', { socketId: socket.id, error: error.message });
                    socket.emit('error', { message: 'Authentication failed' });
                    socket.disconnect();
                }
            });

            // Command handler
            socket.on('command', async (data) => {
                if (!this.isSocketAuthenticated(socket.id)) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }

                try {
                    const { command, ...commandData } = data;
                    const allowed = await this.checkRateLimit(command, socket.id);
                    if (!allowed) {
                        socket.emit('error', { message: 'Rate limit exceeded' });
                        return;
                    }

                    const result = await this.executeCommand(command, commandData);
                    socket.emit('command_result', result);
                } catch (error) {
                    logger.error('Command execution failed', { socketId: socket.id, error: error.message });
                    socket.emit('error', { message: error.message });
                }
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                logger.info('Socket disconnected', { socketId: socket.id });
                this.authenticatedSockets.delete(socket.id);
                this.socketErrors.delete(socket.id);
                this.socketPings.delete(socket.id);
                this.socketCommands.delete(socket.id);
                clearTimeout(authTimeout);
            });
        });
    }

    /**
     * Initialize the socket manager
     */
    async initialize() {
        logger.info('Initializing socket manager');
        // Add initialization logic here
    }

    /**
     * Cleanup the socket manager
     */
    async cleanup() {
        logger.info('Cleaning up socket manager');
        // Clear all intervals
        for (const interval of this.cleanupIntervals.values()) {
            clearInterval(interval);
        }
        this.cleanupIntervals.clear();
    }

    broadcastAutomationUpdate(automation) {
        if (!this.io) return;
        this.io.emit('automation:updated', automation);
        logger.info('Broadcast automation update', { automationId: automation._id });
    }

    broadcastAutomationCreated(automation) {
        if (!this.io) return;
        this.io.emit('automation:created', automation);
        logger.info('Broadcast automation created', { automationId: automation._id });
    }

    broadcastAutomationDeleted(automationId) {
        if (!this.io) return;
        this.io.emit('automation:deleted', { id: automationId });
        logger.info('Broadcast automation deleted', { automationId });
    }
}

// Create and export the socket manager instance
const socketManager = new SocketManager();
export { socketManager }; 