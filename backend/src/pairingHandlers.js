/**
 * Device pairing and management handlers
 * @module pairingHandlers
 */

import { EventEmitter } from 'events';
import { loggerInstance as logger } from './utils/logger.js';
import config from './config.js';
import { verifyToken } from './auth.js';
import { v4 as uuidv4 } from 'uuid';

// Pairing configuration
const PAIRING_CONFIG = {
    MAX_PAIRED_DEVICES: 10,
    PAIRING_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    MAX_PAIRING_ATTEMPTS: 3,
    PAIRING_CODE_LENGTH: 6,
    PAIRING_CODE_CHARS: '0123456789',
    DEVICE_NAME_MAX_LENGTH: 32,
    DEVICE_DESCRIPTION_MAX_LENGTH: 256,
    DEVICE_TYPES: ['switch', 'sensor', 'camera', 'alarm', 'other'],
    DEFAULT_DEVICE_TYPE: 'other',
    MAX_DEVICE_NAME_CHANGES: 3,
    NAME_CHANGE_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours
    DEVICE_STATUS_UPDATE_INTERVAL: 30 * 1000, // 30 seconds
    DEVICE_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_INACTIVE_DAYS: 30,
    MAX_DEVICE_ERRORS: 10,
    ERROR_RESET_INTERVAL: 60 * 60 * 1000, // 1 hour
    MAX_CONCURRENT_PAIRINGS: 5,
    PAIRING_CODE_EXPIRY: 10 * 60 * 1000, // 10 minutes
    DEVICE_METADATA_LIMIT: 1024, // 1KB
    MAX_DEVICE_TAGS: 5,
    TAG_MAX_LENGTH: 20,
    MAX_DEVICE_GROUPS: 3,
    GROUP_NAME_MAX_LENGTH: 32,
    MAX_DEVICES_PER_GROUP: 20,
    DEVICE_HISTORY_LIMIT: 100,
    HISTORY_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_DEVICE_NOTES: 10,
    NOTE_MAX_LENGTH: 500,
    MAX_DEVICE_ALERTS: 20,
    ALERT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_DEVICE_PERMISSIONS: 5,
    PERMISSION_TYPES: ['read', 'write', 'admin'],
    DEFAULT_PERMISSION: 'read',
    MAX_DEVICE_SHARES: 10,
    SHARE_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
    MAX_DEVICE_BACKUPS: 5,
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_BACKUP_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_STATS_INTERVAL: 60 * 60 * 1000, // 1 hour
    MAX_STATS_HISTORY: 30 * 24, // 30 days
    DEVICE_EVENTS_LIMIT: 1000,
    EVENT_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_EVENT_TYPES: 20,
    EVENT_TYPE_MAX_LENGTH: 32,
    MAX_EVENT_DATA_SIZE: 1024, // 1KB
    DEVICE_LOGS_LIMIT: 1000,
    LOG_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_LOG_LEVELS: ['debug', 'info', 'warn', 'error', 'critical'],
    DEFAULT_LOG_LEVEL: 'info',
    MAX_LOG_MESSAGE_LENGTH: 500,
    DEVICE_SETTINGS_LIMIT: 1024, // 1KB
    SETTINGS_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_SETTING_NAME_LENGTH: 64,
    MAX_SETTING_VALUE_LENGTH: 256,
    DEVICE_FIRMWARE_LIMIT: 10 * 1024 * 1024, // 10MB
    FIRMWARE_UPDATE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_FIRMWARE_VERSIONS: 5,
    FIRMWARE_BACKUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 days
    DEVICE_NETWORK_LIMIT: 5,
    NETWORK_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_NETWORK_NAME_LENGTH: 32,
    MAX_NETWORK_PASSWORD_LENGTH: 64,
    DEVICE_LOCATION_LIMIT: 10,
    LOCATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_LOCATION_NAME_LENGTH: 64,
    MAX_LOCATION_DESCRIPTION_LENGTH: 256,
    DEVICE_SCHEDULE_LIMIT: 20,
    SCHEDULE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_SCHEDULE_NAME_LENGTH: 64,
    MAX_SCHEDULE_DESCRIPTION_LENGTH: 256,
    DEVICE_SCENE_LIMIT: 10,
    SCENE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_SCENE_NAME_LENGTH: 64,
    MAX_SCENE_DESCRIPTION_LENGTH: 256,
    MAX_SCENE_ACTIONS: 20,
    DEVICE_AUTOMATION_LIMIT: 20,
    AUTOMATION_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    MAX_AUTOMATION_NAME_LENGTH: 64,
    MAX_AUTOMATION_DESCRIPTION_LENGTH: 256,
    MAX_AUTOMATION_TRIGGERS: 10,
    MAX_AUTOMATION_ACTIONS: 10,
    DEVICE_INTEGRATION_LIMIT: 10,
    INTEGRATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_INTEGRATION_NAME_LENGTH: 64,
    MAX_INTEGRATION_DESCRIPTION_LENGTH: 256,
    MAX_INTEGRATION_SETTINGS: 20,
    DEVICE_BACKUP_LIMIT: 5,
    BACKUP_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_BACKUP_NAME_LENGTH: 64,
    MAX_BACKUP_DESCRIPTION_LENGTH: 256,
    MAX_BACKUP_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_RESTORE_LIMIT: 5,
    RESTORE_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_RESTORE_NAME_LENGTH: 64,
    MAX_RESTORE_DESCRIPTION_LENGTH: 256,
    MAX_RESTORE_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_MIGRATION_LIMIT: 5,
    MIGRATION_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_MIGRATION_NAME_LENGTH: 64,
    MAX_MIGRATION_DESCRIPTION_LENGTH: 256,
    MAX_MIGRATION_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_SYNC_LIMIT: 5,
    SYNC_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_SYNC_NAME_LENGTH: 64,
    MAX_SYNC_DESCRIPTION_LENGTH: 256,
    MAX_SYNC_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_UPDATE_LIMIT: 5,
    UPDATE_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_UPDATE_NAME_LENGTH: 64,
    MAX_UPDATE_DESCRIPTION_LENGTH: 256,
    MAX_UPDATE_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_DOWNLOAD_LIMIT: 5,
    DOWNLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_DOWNLOAD_NAME_LENGTH: 64,
    MAX_DOWNLOAD_DESCRIPTION_LENGTH: 256,
    MAX_DOWNLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_UPLOAD_LIMIT: 5,
    UPLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_UPLOAD_NAME_LENGTH: 64,
    MAX_UPLOAD_DESCRIPTION_LENGTH: 256,
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_EXPORT_LIMIT: 5,
    EXPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_EXPORT_NAME_LENGTH: 64,
    MAX_EXPORT_DESCRIPTION_LENGTH: 256,
    MAX_EXPORT_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_IMPORT_LIMIT: 5,
    IMPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    MAX_IMPORT_NAME_LENGTH: 64,
    MAX_IMPORT_DESCRIPTION_LENGTH: 256,
    MAX_IMPORT_SIZE: 10 * 1024 * 1024, // 10MB
    DEVICE_BACKUP_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    DEVICE_LOG_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    DEVICE_EVENT_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    DEVICE_STATS_RETENTION: 90 * 24 * 60 * 60 * 1000, // 90 days
    DEVICE_ALERT_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    DEVICE_HISTORY_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    DEVICE_SETTINGS_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_FIRMWARE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_NETWORK_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_LOCATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_SCHEDULE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_SCENE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_AUTOMATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_INTEGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_BACKUP_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_RESTORE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_MIGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_SYNC_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_UPDATE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_DOWNLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_UPLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_EXPORT_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    DEVICE_IMPORT_RETENTION: 365 * 24 * 60 * 60 * 1000 // 365 days
};

/**
 * Device pairing and management class
 */
class PairingManager extends EventEmitter {
    constructor() {
        super();
        this.pairedDevices = new Map();
        this.pairingCodes = new Map();
        this.pairingAttempts = new Map();
        this.deviceGroups = new Map();
        this.deviceHistory = new Map();
        this.deviceStats = new Map();
        this.deviceEvents = new Map();
        this.deviceLogs = new Map();
        this.deviceSettings = new Map();
        this.deviceFirmware = new Map();
        this.deviceNetwork = new Map();
        this.deviceLocation = new Map();
        this.deviceSchedule = new Map();
        this.deviceScene = new Map();
        this.deviceAutomation = new Map();
        this.deviceIntegration = new Map();
        this.deviceBackup = new Map();
        this.deviceRestore = new Map();
        this.deviceMigration = new Map();
        this.deviceSync = new Map();
        this.deviceUpdate = new Map();
        this.deviceDownload = new Map();
        this.deviceUpload = new Map();
        this.deviceExport = new Map();
        this.deviceImport = new Map();
        this.cleanupIntervals = new Map();
        this.initializeCleanupIntervals();
    }

    /**
     * Initialize cleanup intervals
     */
    initializeCleanupIntervals() {
        // Device cleanup
        this.cleanupIntervals.set('devices', setInterval(
            () => this.cleanupInactiveDevices(),
            PAIRING_CONFIG.DEVICE_CLEANUP_INTERVAL
        ));

        // History cleanup
        this.cleanupIntervals.set('history', setInterval(
            () => this.cleanupDeviceHistory(),
            PAIRING_CONFIG.HISTORY_CLEANUP_INTERVAL
        ));

        // Stats cleanup
        this.cleanupIntervals.set('stats', setInterval(
            () => this.cleanupDeviceStats(),
            PAIRING_CONFIG.DEVICE_STATS_INTERVAL
        ));

        // Events cleanup
        this.cleanupIntervals.set('events', setInterval(
            () => this.cleanupDeviceEvents(),
            PAIRING_CONFIG.EVENT_CLEANUP_INTERVAL
        ));

        // Logs cleanup
        this.cleanupIntervals.set('logs', setInterval(
            () => this.cleanupDeviceLogs(),
            PAIRING_CONFIG.LOG_CLEANUP_INTERVAL
        ));
    }

    /**
     * Generate a pairing code
     * @returns {string} Pairing code
     */
    generatePairingCode() {
        let code = '';
        for (let i = 0; i < PAIRING_CONFIG.PAIRING_CODE_LENGTH; i++) {
            code += PAIRING_CONFIG.PAIRING_CODE_CHARS.charAt(
                Math.floor(Math.random() * PAIRING_CONFIG.PAIRING_CODE_CHARS.length)
            );
        }
        return code;
    }

    /**
     * Start device pairing process
     * @param {Object} deviceInfo - Device information
     * @returns {Object} Pairing information
     */
    startPairing(deviceInfo) {
        try {
            // Validate device info
            this.validateDeviceInfo(deviceInfo);

            // Check if device is already paired
            if (this.isDevicePaired(deviceInfo.id)) {
                throw new Error('Device is already paired');
            }

            // Check pairing attempts
            const attempts = this.pairingAttempts.get(deviceInfo.id) || 0;
            if (attempts >= PAIRING_CONFIG.MAX_PAIRING_ATTEMPTS) {
                throw new Error('Maximum pairing attempts reached');
            }

            // Generate pairing code
            const pairingCode = this.generatePairingCode();
            const expiry = Date.now() + PAIRING_CONFIG.PAIRING_CODE_EXPIRY;

            // Store pairing information
            this.pairingCodes.set(deviceInfo.id, {
                code: pairingCode,
                expiry,
                deviceInfo
            });

            // Increment pairing attempts
            this.pairingAttempts.set(deviceInfo.id, attempts + 1);

            // Emit pairing started event
            this.emit('pairingStarted', {
                deviceId: deviceInfo.id,
                pairingCode,
                expiry
            });

            return {
                pairingCode,
                expiry
            };
        } catch (error) {
            logger.error('Failed to start pairing:', error);
            throw error;
        }
    }

    /**
     * Complete device pairing process
     * @param {string} deviceId - Device ID
     * @param {string} pairingCode - Pairing code
     * @returns {Object} Device information
     */
    completePairing(deviceId, pairingCode) {
        try {
            // Get pairing information
            const pairingInfo = this.pairingCodes.get(deviceId);
            if (!pairingInfo) {
                throw new Error('Invalid device ID or pairing code');
            }

            // Check if pairing code is expired
            if (Date.now() > pairingInfo.expiry) {
                this.pairingCodes.delete(deviceId);
                throw new Error('Pairing code has expired');
            }

            // Verify pairing code
            if (pairingCode !== pairingInfo.code) {
                throw new Error('Invalid pairing code');
            }

            // Create device record
            const device = {
                id: deviceId,
                ...pairingInfo.deviceInfo,
                pairedAt: Date.now(),
                lastSeen: Date.now(),
                status: 'active',
                errors: 0
            };

            // Store device information
            this.pairedDevices.set(deviceId, device);

            // Clear pairing information
            this.pairingCodes.delete(deviceId);
            this.pairingAttempts.delete(deviceId);

            // Initialize device collections
            this.initializeDeviceCollections(deviceId);

            // Emit pairing completed event
            this.emit('pairingCompleted', device);

            return device;
        } catch (error) {
            logger.error('Failed to complete pairing:', error);
            throw error;
        }
    }

    /**
     * Initialize device collections
     * @param {string} deviceId - Device ID
     */
    initializeDeviceCollections(deviceId) {
        this.deviceHistory.set(deviceId, []);
        this.deviceStats.set(deviceId, {
            lastUpdated: Date.now(),
            stats: {}
        });
        this.deviceEvents.set(deviceId, []);
        this.deviceLogs.set(deviceId, []);
        this.deviceSettings.set(deviceId, {});
        this.deviceFirmware.set(deviceId, {
            current: null,
            available: []
        });
        this.deviceNetwork.set(deviceId, {
            connections: []
        });
        this.deviceLocation.set(deviceId, {
            current: null,
            history: []
        });
        this.deviceSchedule.set(deviceId, []);
        this.deviceScene.set(deviceId, []);
        this.deviceAutomation.set(deviceId, []);
        this.deviceIntegration.set(deviceId, []);
        this.deviceBackup.set(deviceId, []);
        this.deviceRestore.set(deviceId, []);
        this.deviceMigration.set(deviceId, []);
        this.deviceSync.set(deviceId, []);
        this.deviceUpdate.set(deviceId, []);
        this.deviceDownload.set(deviceId, []);
        this.deviceUpload.set(deviceId, []);
        this.deviceExport.set(deviceId, []);
        this.deviceImport.set(deviceId, []);
    }

    /**
     * Validate device information
     * @param {Object} deviceInfo - Device information
     */
    validateDeviceInfo(deviceInfo) {
        if (!deviceInfo.id) {
            throw new Error('Device ID is required');
        }

        if (!deviceInfo.name) {
            throw new Error('Device name is required');
        }

        if (deviceInfo.name.length > PAIRING_CONFIG.DEVICE_NAME_MAX_LENGTH) {
            throw new Error(`Device name exceeds maximum length of ${PAIRING_CONFIG.DEVICE_NAME_MAX_LENGTH} characters`);
        }

        if (deviceInfo.description && deviceInfo.description.length > PAIRING_CONFIG.DEVICE_DESCRIPTION_MAX_LENGTH) {
            throw new Error(`Device description exceeds maximum length of ${PAIRING_CONFIG.DEVICE_DESCRIPTION_MAX_LENGTH} characters`);
        }

        if (deviceInfo.type && !PAIRING_CONFIG.DEVICE_TYPES.includes(deviceInfo.type)) {
            throw new Error(`Invalid device type. Must be one of: ${PAIRING_CONFIG.DEVICE_TYPES.join(', ')}`);
        }
    }

    /**
     * Check if device is paired
     * @param {string} deviceId - Device ID
     * @returns {boolean} Whether device is paired
     */
    isDevicePaired(deviceId) {
        return this.pairedDevices.has(deviceId);
    }

    /**
     * Get paired device information
     * @param {string} deviceId - Device ID
     * @returns {Object} Device information
     */
    getDeviceInfo(deviceId) {
        const device = this.pairedDevices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        return device;
    }

    /**
     * Update device status
     * @param {string} deviceId - Device ID
     * @param {string} status - New status
     */
    updateDeviceStatus(deviceId, status) {
        const device = this.getDeviceInfo(deviceId);
        device.status = status;
        device.lastSeen = Date.now();
        this.pairedDevices.set(deviceId, device);
        this.emit('deviceStatusUpdated', { deviceId, status });
    }

    /**
     * Clean up inactive devices
     */
    cleanupInactiveDevices() {
        const now = Date.now();
        for (const [deviceId, device] of this.pairedDevices.entries()) {
            if (now - device.lastSeen > PAIRING_CONFIG.MAX_INACTIVE_DAYS * 24 * 60 * 60 * 1000) {
                this.removeDevice(deviceId);
            }
        }
    }

    /**
     * Remove device
     * @param {string} deviceId - Device ID
     */
    removeDevice(deviceId) {
        this.pairedDevices.delete(deviceId);
        this.deviceHistory.delete(deviceId);
        this.deviceStats.delete(deviceId);
        this.deviceEvents.delete(deviceId);
        this.deviceLogs.delete(deviceId);
        this.deviceSettings.delete(deviceId);
        this.deviceFirmware.delete(deviceId);
        this.deviceNetwork.delete(deviceId);
        this.deviceLocation.delete(deviceId);
        this.deviceSchedule.delete(deviceId);
        this.deviceScene.delete(deviceId);
        this.deviceAutomation.delete(deviceId);
        this.deviceIntegration.delete(deviceId);
        this.deviceBackup.delete(deviceId);
        this.deviceRestore.delete(deviceId);
        this.deviceMigration.delete(deviceId);
        this.deviceSync.delete(deviceId);
        this.deviceUpdate.delete(deviceId);
        this.deviceDownload.delete(deviceId);
        this.deviceUpload.delete(deviceId);
        this.deviceExport.delete(deviceId);
        this.deviceImport.delete(deviceId);
        this.emit('deviceRemoved', deviceId);
    }

    /**
     * Clean up device history
     */
    cleanupDeviceHistory() {
        const now = Date.now();
        for (const [deviceId, history] of this.deviceHistory.entries()) {
            this.deviceHistory.set(
                deviceId,
                history.filter(entry => now - entry.timestamp <= PAIRING_CONFIG.DEVICE_HISTORY_RETENTION)
            );
        }
    }

    /**
     * Clean up device stats
     */
    cleanupDeviceStats() {
        const now = Date.now();
        for (const [deviceId, stats] of this.deviceStats.entries()) {
            if (now - stats.lastUpdated > PAIRING_CONFIG.DEVICE_STATS_RETENTION) {
                this.deviceStats.delete(deviceId);
            }
        }
    }

    /**
     * Clean up device events
     */
    cleanupDeviceEvents() {
        const now = Date.now();
        for (const [deviceId, events] of this.deviceEvents.entries()) {
            this.deviceEvents.set(
                deviceId,
                events.filter(event => now - event.timestamp <= PAIRING_CONFIG.DEVICE_EVENT_RETENTION)
            );
        }
    }

    /**
     * Clean up device logs
     */
    cleanupDeviceLogs() {
        const now = Date.now();
        for (const [deviceId, logs] of this.deviceLogs.entries()) {
            this.deviceLogs.set(
                deviceId,
                logs.filter(log => now - log.timestamp <= PAIRING_CONFIG.DEVICE_LOG_RETENTION)
            );
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Clear all intervals
        for (const interval of this.cleanupIntervals.values()) {
            clearInterval(interval);
        }
        this.cleanupIntervals.clear();

        // Clear all collections
        this.pairedDevices.clear();
        this.pairingCodes.clear();
        this.pairingAttempts.clear();
        this.deviceGroups.clear();
        this.deviceHistory.clear();
        this.deviceStats.clear();
        this.deviceEvents.clear();
        this.deviceLogs.clear();
        this.deviceSettings.clear();
        this.deviceFirmware.clear();
        this.deviceNetwork.clear();
        this.deviceLocation.clear();
        this.deviceSchedule.clear();
        this.deviceScene.clear();
        this.deviceAutomation.clear();
        this.deviceIntegration.clear();
        this.deviceBackup.clear();
        this.deviceRestore.clear();
        this.deviceMigration.clear();
        this.deviceSync.clear();
        this.deviceUpdate.clear();
        this.deviceDownload.clear();
        this.deviceUpload.clear();
        this.deviceExport.clear();
        this.deviceImport.clear();
    }
}

// Create and export singleton instance
const pairingManager = new PairingManager();
export default pairingManager; 