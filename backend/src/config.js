/**
 * Configuration module
 * @module config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import mongoose from 'mongoose';
import { loggerInstance as logger } from './utils/logger.js';
import crypto from 'crypto';
import fs from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables before any other operations
dotenv.config({ path: join(__dirname, '../../.env') });

// Configuration categories
const CONFIG_CATEGORIES = {
    SERVER: 'server',
    DATABASE: 'database',
    AUTH: 'auth',
    STORAGE: 'storage',
    RUST: 'rust',
    SECURITY: 'security',
    LOGGING: 'logging',
    SOCKET: 'socket',
    RATE_LIMIT: 'rateLimit',
    CACHE: 'cache',
    // New categories
    PLAYER: 'player',
    SWITCH: 'switch',
    VENDING: 'vending',
    PAIRING: 'pairing',
    FIRMWARE: 'firmware',
    NETWORK: 'network',
    LOCATION: 'location',
    SCHEDULE: 'schedule',
    SCENE: 'scene',
    AUTOMATION: 'automation',
    INTEGRATION: 'integration',
    BACKUP: 'backup',
    RESTORE: 'restore',
    MIGRATION: 'migration',
    SYNC: 'sync',
    UPDATE: 'update',
    DOWNLOAD: 'download',
    UPLOAD: 'upload',
    EXPORT: 'export',
    IMPORT: 'import'
};

// Default configuration
const defaults = {
    // Server configuration
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: '0.0.0.0',
    API_VERSION: '1.0.0',
    MAX_REQUEST_SIZE: '10mb',
    SHUTDOWN_TIMEOUT: 5000,

    // Database configuration
    MONGODB_URI: 'mongodb://localhost:27017/kinabot',
    DB_RECONNECT_INTERVAL: 5000,
    MAX_DB_RECONNECT_ATTEMPTS: 5,
    DB_POOL_SIZE: 10,
    DB_SOCKET_TIMEOUT: 45000,

    // Authentication configuration
    AUTH_SECRET: 'your-secure-auth-secret',
    AUTH_EXPIRES_IN: '24h',
    AUTH_REFRESH_IN: '7d',
    AUTH_SALT_ROUNDS: 10,
    AUTH_MAX_SESSIONS: 5,
    AUTH_RATE_LIMIT: 5,
    AUTH_RATE_WINDOW: 60,

    // Storage configuration
    STORAGE_PATH: './storage',
    STORAGE_BACKUP_PATH: './storage/backups',
    STORAGE_MAX_SIZE: '1gb',
    STORAGE_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    STORAGE_CLEANUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Rust server configuration
    RUST_SERVER_IP: '127.0.0.1',
    RUST_SERVER_PORT: 28015,
    RUST_SERVER_PLAYER_TOKEN: '',
    RUST_SERVER_STEAM_ID: '',
    RUST_RECONNECT_INTERVAL: 5000,
    RUST_MAX_RECONNECT_ATTEMPTS: 5,
    RUST_COMMAND_TIMEOUT: 10000,

    // Security configuration
    CORS_ORIGIN: 'http://localhost:3001',
    SESSION_SECRET: 'your-secure-session-secret',
    COOKIE_SECURE: true,
    COOKIE_HTTP_ONLY: true,
    COOKIE_SAME_SITE: 'strict',
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100,
    MAX_REQUEST_SIZE: '10mb',

    // Logging configuration
    LOG_LEVEL: 'info',
    LOG_FILE: 'kinabot.log',
    LOG_MAX_SIZE: '10mb',
    LOG_MAX_FILES: 5,
    LOG_FORMAT: 'json',

    // Socket configuration
    SOCKET_PING_TIMEOUT: 60000,
    SOCKET_PING_INTERVAL: 25000,
    SOCKET_CONNECT_TIMEOUT: 45000,
    SOCKET_MAX_HTTP_BUFFER_SIZE: '1mb',
    SOCKET_MAX_SOCKETS: 100,
    SOCKET_MAX_COMMANDS: 1000,
    SOCKET_MAX_ERRORS: 10,
    SOCKET_ERROR_RESET_INTERVAL: 60 * 60 * 1000, // 1 hour

    // Cache configuration
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    CACHE_MAX_SIZE: '100mb',
    CACHE_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour

    // Middleware configuration
    RATE_LIMIT_POINTS: 100,
    RATE_LIMIT_DURATION: 60,
    RATE_LIMIT_BLOCK_DURATION: 300,
    COMPRESSION_LEVEL: 6,
    COMPRESSION_THRESHOLD: 1024,
    SLOW_REQUEST_THRESHOLD: 1000,
    CORS_ORIGIN: 'http://localhost:3001',
    CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
    CORS_EXPOSED_HEADERS: ['x-request-id'],
    CORS_CREDENTIALS: true,
    CORS_MAX_AGE: 86400,

    // Player configuration
    PLAYER_MAX_COUNT: 100,
    PLAYER_UPDATE_INTERVAL: 60 * 1000, // 1 minute
    PLAYER_HISTORY_LIMIT: 100,
    PLAYER_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PLAYER_MAX_NAME_LENGTH: 32,
    PLAYER_MAX_NOTES: 10,
    PLAYER_NOTE_MAX_LENGTH: 500,
    PLAYER_MAX_ALERTS: 20,
    PLAYER_ALERT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Switch configuration
    SWITCH_MAX_COUNT: 50,
    SWITCH_UPDATE_INTERVAL: 5 * 1000, // 5 seconds
    SWITCH_HISTORY_LIMIT: 100,
    SWITCH_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    SWITCH_MAX_NAME_LENGTH: 32,
    SWITCH_MAX_DESCRIPTION_LENGTH: 256,
    SWITCH_MAX_NOTES: 10,
    SWITCH_NOTE_MAX_LENGTH: 500,
    SWITCH_MAX_ALERTS: 20,
    SWITCH_ALERT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Vending configuration
    VENDING_MAX_COUNT: 20,
    VENDING_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    VENDING_HISTORY_LIMIT: 100,
    VENDING_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    VENDING_MAX_NAME_LENGTH: 32,
    VENDING_MAX_DESCRIPTION_LENGTH: 256,
    VENDING_MAX_ITEMS: 100,
    VENDING_MAX_ITEM_NAME_LENGTH: 64,
    VENDING_MAX_ITEM_DESCRIPTION_LENGTH: 256,
    VENDING_MAX_ITEM_PRICE: 1000000,
    VENDING_MAX_ITEM_QUANTITY: 1000,

    // Pairing configuration
    PAIRING_TIMEOUT: 30 * 1000, // 30 seconds
    PAIRING_MAX_ATTEMPTS: 3,
    PAIRING_CODE_LENGTH: 6,
    PAIRING_CODE_EXPIRY: 5 * 60 * 1000, // 5 minutes
    PAIRING_MAX_DEVICES: 10,
    PAIRING_DEVICE_NAME_MAX_LENGTH: 32,
    PAIRING_DEVICE_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_TYPE_MAX_LENGTH: 32,
    PAIRING_DEVICE_VERSION_MAX_LENGTH: 32,
    PAIRING_DEVICE_SERIAL_MAX_LENGTH: 64,
    PAIRING_DEVICE_MAC_MAX_LENGTH: 17,
    PAIRING_DEVICE_IP_MAX_LENGTH: 15,
    PAIRING_DEVICE_PORT_MIN: 1,
    PAIRING_DEVICE_PORT_MAX: 65535,
    PAIRING_DEVICE_STATUS_MAX_LENGTH: 32,
    PAIRING_DEVICE_STATUS_UPDATE_INTERVAL: 5 * 1000, // 5 seconds
    PAIRING_DEVICE_STATUS_HISTORY_LIMIT: 100,
    PAIRING_DEVICE_STATUS_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_SETTINGS_MAX_SIZE: 1024, // 1KB
    PAIRING_DEVICE_SETTINGS_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_SETTINGS_HISTORY_LIMIT: 100,
    PAIRING_DEVICE_SETTINGS_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_FIRMWARE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_FIRMWARE_UPDATE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    PAIRING_DEVICE_FIRMWARE_MAX_VERSIONS: 5,
    PAIRING_DEVICE_FIRMWARE_BACKUP_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 days
    PAIRING_DEVICE_NETWORK_MAX_COUNT: 5,
    PAIRING_DEVICE_NETWORK_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_NETWORK_NAME_MAX_LENGTH: 32,
    PAIRING_DEVICE_NETWORK_PASSWORD_MAX_LENGTH: 64,
    PAIRING_DEVICE_LOCATION_MAX_COUNT: 10,
    PAIRING_DEVICE_LOCATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_LOCATION_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_LOCATION_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_SCHEDULE_MAX_COUNT: 20,
    PAIRING_DEVICE_SCHEDULE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    PAIRING_DEVICE_SCHEDULE_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_SCHEDULE_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_SCENE_MAX_COUNT: 10,
    PAIRING_DEVICE_SCENE_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    PAIRING_DEVICE_SCENE_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_SCENE_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_SCENE_MAX_ACTIONS: 20,
    PAIRING_DEVICE_AUTOMATION_MAX_COUNT: 20,
    PAIRING_DEVICE_AUTOMATION_UPDATE_INTERVAL: 1 * 60 * 1000, // 1 minute
    PAIRING_DEVICE_AUTOMATION_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_AUTOMATION_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_AUTOMATION_MAX_TRIGGERS: 10,
    PAIRING_DEVICE_AUTOMATION_MAX_ACTIONS: 10,
    PAIRING_DEVICE_INTEGRATION_MAX_COUNT: 10,
    PAIRING_DEVICE_INTEGRATION_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_INTEGRATION_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_INTEGRATION_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_INTEGRATION_MAX_SETTINGS: 20,
    PAIRING_DEVICE_BACKUP_MAX_COUNT: 5,
    PAIRING_DEVICE_BACKUP_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_BACKUP_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_BACKUP_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_BACKUP_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_RESTORE_MAX_COUNT: 5,
    PAIRING_DEVICE_RESTORE_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_RESTORE_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_RESTORE_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_RESTORE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_MIGRATION_MAX_COUNT: 5,
    PAIRING_DEVICE_MIGRATION_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_MIGRATION_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_MIGRATION_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_MIGRATION_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_SYNC_MAX_COUNT: 5,
    PAIRING_DEVICE_SYNC_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_SYNC_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_SYNC_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_SYNC_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_UPDATE_MAX_COUNT: 5,
    PAIRING_DEVICE_UPDATE_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_UPDATE_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_UPDATE_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_UPDATE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_DOWNLOAD_MAX_COUNT: 5,
    PAIRING_DEVICE_DOWNLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_DOWNLOAD_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_DOWNLOAD_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_DOWNLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_UPLOAD_MAX_COUNT: 5,
    PAIRING_DEVICE_UPLOAD_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIRING_DEVICE_UPLOAD_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_UPLOAD_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_EXPORT_MAX_COUNT: 5,
    PAIRING_DEVICE_EXPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_EXPORT_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_EXPORT_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_EXPORT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_IMPORT_MAX_COUNT: 5,
    PAIRING_DEVICE_IMPORT_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    PAIRING_DEVICE_IMPORT_NAME_MAX_LENGTH: 64,
    PAIRING_DEVICE_IMPORT_DESCRIPTION_MAX_LENGTH: 256,
    PAIRING_DEVICE_IMPORT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    PAIRING_DEVICE_BACKUP_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    PAIRING_DEVICE_LOG_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    PAIRING_DEVICE_EVENT_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    PAIRING_DEVICE_STATS_RETENTION: 90 * 24 * 60 * 60 * 1000, // 90 days
    PAIRING_DEVICE_ALERT_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    PAIRING_DEVICE_HISTORY_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
    PAIRING_DEVICE_SETTINGS_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_FIRMWARE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_NETWORK_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_LOCATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_SCHEDULE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_SCENE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_AUTOMATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_INTEGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_BACKUP_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_RESTORE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_MIGRATION_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_SYNC_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_UPDATE_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_DOWNLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_UPLOAD_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_EXPORT_RETENTION: 365 * 24 * 60 * 60 * 1000, // 365 days
    PAIRING_DEVICE_IMPORT_RETENTION: 365 * 24 * 60 * 60 * 1000 // 365 days
};

// Configuration validators
const validators = {
    // Server validators
    NODE_ENV: (value) => {
        if (!['development', 'production', 'test'].includes(value)) {
            throw new Error('Invalid NODE_ENV value');
        }
        return value;
    },
    PORT: (value) => {
        const port = parseInt(value, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error('Invalid port number');
        }
        return port;
    },
    HOST: (value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('Invalid host value');
        }
        return value;
    },

    // Database validators
    MONGODB_URI: (value) => {
        if (!value || !value.startsWith('mongodb')) {
            throw new Error('Invalid MongoDB URI format');
        }
        return value;
    },
    DB_POOL_SIZE: (value) => {
        const size = parseInt(value, 10);
        if (isNaN(size) || size < 1) {
            throw new Error('Invalid database pool size');
        }
        return size;
    },

    // Authentication validators
    AUTH_SECRET: (value) => {
        if (!value || value.length < 32) {
            throw new Error('Auth secret must be at least 32 characters');
        }
        return value;
    },
    AUTH_SALT_ROUNDS: (value) => {
        const rounds = parseInt(value, 10);
        if (isNaN(rounds) || rounds < 10 || rounds > 20) {
            throw new Error('Invalid salt rounds value');
        }
        return rounds;
    },

    // Storage validators
    STORAGE_PATH: (value) => {
        if (!value || typeof value !== 'string') {
            throw new Error('Invalid storage path');
        }
        return resolve(value);
    },
    STORAGE_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid storage size format');
        }
        return value;
    },

    // Rust server validators
    RUST_SERVER_IP: (value) => {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(value)) {
            throw new Error('Invalid IP address format');
        }
        return value;
    },
    RUST_SERVER_PORT: (value) => {
        const port = parseInt(value, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error('Invalid port number');
        }
        return port;
    },

    // Security validators
    CORS_ORIGIN: (value) => {
        try {
            new URL(value);
            return value;
        } catch {
            throw new Error('Invalid CORS origin URL');
        }
    },

    // Logging validators
    LOG_LEVEL: (value) => {
        if (!['error', 'warn', 'info', 'debug', 'trace'].includes(value)) {
            throw new Error('Invalid log level');
        }
        return value;
    },

    // Socket validators
    SOCKET_MAX_SOCKETS: (value) => {
        const max = parseInt(value, 10);
        if (isNaN(max) || max < 1) {
            throw new Error('Invalid max sockets value');
        }
        return max;
    },

    // Player validators
    PLAYER_MAX_COUNT: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1) {
            throw new Error('Invalid player max count');
        }
        return count;
    },
    PLAYER_UPDATE_INTERVAL: (value) => {
        const interval = parseInt(value, 10);
        if (isNaN(interval) || interval < 1000) {
            throw new Error('Invalid player update interval');
        }
        return interval;
    },

    // Switch validators
    SWITCH_MAX_COUNT: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1) {
            throw new Error('Invalid switch max count');
        }
        return count;
    },
    SWITCH_UPDATE_INTERVAL: (value) => {
        const interval = parseInt(value, 10);
        if (isNaN(interval) || interval < 1000) {
            throw new Error('Invalid switch update interval');
        }
        return interval;
    },

    // Vending validators
    VENDING_MAX_COUNT: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1) {
            throw new Error('Invalid vending max count');
        }
        return count;
    },
    VENDING_UPDATE_INTERVAL: (value) => {
        const interval = parseInt(value, 10);
        if (isNaN(interval) || interval < 1000) {
            throw new Error('Invalid vending update interval');
        }
        return interval;
    },

    // Pairing validators
    PAIRING_TIMEOUT: (value) => {
        const timeout = parseInt(value, 10);
        if (isNaN(timeout) || timeout < 1000) {
            throw new Error('Invalid pairing timeout');
        }
        return timeout;
    },
    PAIRING_MAX_ATTEMPTS: (value) => {
        const attempts = parseInt(value, 10);
        if (isNaN(attempts) || attempts < 1) {
            throw new Error('Invalid pairing max attempts');
        }
        return attempts;
    },
    PAIRING_CODE_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 4 || length > 12) {
            throw new Error('Invalid pairing code length');
        }
        return length;
    },

    // Firmware validators
    FIRMWARE_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid firmware size format');
        }
        return value;
    },
    FIRMWARE_UPDATE_TIMEOUT: (value) => {
        const timeout = parseInt(value, 10);
        if (isNaN(timeout) || timeout < 60000) {
            throw new Error('Invalid firmware update timeout');
        }
        return timeout;
    },

    // Network validators
    NETWORK_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid network name max length');
        }
        return length;
    },
    NETWORK_PASSWORD_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 8 || length > 128) {
            throw new Error('Invalid network password max length');
        }
        return length;
    },

    // Location validators
    LOCATION_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid location name max length');
        }
        return length;
    },
    LOCATION_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid location description max length');
        }
        return length;
    },

    // Schedule validators
    SCHEDULE_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid schedule name max length');
        }
        return length;
    },
    SCHEDULE_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid schedule description max length');
        }
        return length;
    },

    // Scene validators
    SCENE_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid scene name max length');
        }
        return length;
    },
    SCENE_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid scene description max length');
        }
        return length;
    },
    SCENE_MAX_ACTIONS: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1 || count > 100) {
            throw new Error('Invalid scene max actions');
        }
        return count;
    },

    // Automation validators
    AUTOMATION_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid automation name max length');
        }
        return length;
    },
    AUTOMATION_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid automation description max length');
        }
        return length;
    },
    AUTOMATION_MAX_TRIGGERS: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1 || count > 50) {
            throw new Error('Invalid automation max triggers');
        }
        return count;
    },
    AUTOMATION_MAX_ACTIONS: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1 || count > 50) {
            throw new Error('Invalid automation max actions');
        }
        return count;
    },

    // Integration validators
    INTEGRATION_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid integration name max length');
        }
        return length;
    },
    INTEGRATION_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid integration description max length');
        }
        return length;
    },
    INTEGRATION_MAX_SETTINGS: (value) => {
        const count = parseInt(value, 10);
        if (isNaN(count) || count < 1 || count > 100) {
            throw new Error('Invalid integration max settings');
        }
        return count;
    },

    // Backup validators
    BACKUP_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid backup name max length');
        }
        return length;
    },
    BACKUP_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid backup description max length');
        }
        return length;
    },
    BACKUP_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid backup size format');
        }
        return value;
    },

    // Restore validators
    RESTORE_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid restore name max length');
        }
        return length;
    },
    RESTORE_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid restore description max length');
        }
        return length;
    },
    RESTORE_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid restore size format');
        }
        return value;
    },

    // Migration validators
    MIGRATION_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid migration name max length');
        }
        return length;
    },
    MIGRATION_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid migration description max length');
        }
        return length;
    },
    MIGRATION_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid migration size format');
        }
        return value;
    },

    // Sync validators
    SYNC_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid sync name max length');
        }
        return length;
    },
    SYNC_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid sync description max length');
        }
        return length;
    },
    SYNC_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid sync size format');
        }
        return value;
    },

    // Update validators
    UPDATE_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid update name max length');
        }
        return length;
    },
    UPDATE_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid update description max length');
        }
        return length;
    },
    UPDATE_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid update size format');
        }
        return value;
    },

    // Download validators
    DOWNLOAD_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid download name max length');
        }
        return length;
    },
    DOWNLOAD_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid download description max length');
        }
        return length;
    },
    DOWNLOAD_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid download size format');
        }
        return value;
    },

    // Upload validators
    UPLOAD_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid upload name max length');
        }
        return length;
    },
    UPLOAD_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid upload description max length');
        }
        return length;
    },
    UPLOAD_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid upload size format');
        }
        return value;
    },

    // Export validators
    EXPORT_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid export name max length');
        }
        return length;
    },
    EXPORT_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid export description max length');
        }
        return length;
    },
    EXPORT_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid export size format');
        }
        return value;
    },

    // Import validators
    IMPORT_NAME_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 64) {
            throw new Error('Invalid import name max length');
        }
        return length;
    },
    IMPORT_DESCRIPTION_MAX_LENGTH: (value) => {
        const length = parseInt(value, 10);
        if (isNaN(length) || length < 1 || length > 256) {
            throw new Error('Invalid import description max length');
        }
        return length;
    },
    IMPORT_MAX_SIZE: (value) => {
        if (!value || !/^\d+(?:[kmg]b)?$/i.test(value)) {
            throw new Error('Invalid import size format');
        }
        return value;
    }
};

/**
 * Configuration manager class
 */
class ConfigManager {
    constructor() {
        this.config = this.initializeConfig();
        this.secrets = new Map();
        this.categories = new Map();
        this.initializeCategories();
    }

    /**
     * Initialize configuration categories
     */
    initializeCategories() {
        for (const [key, value] of Object.entries(CONFIG_CATEGORIES)) {
            this.categories.set(value, new Set());
        }

        for (const [key, value] of Object.entries(defaults)) {
            const category = this.getConfigCategory(key);
            if (category) {
                this.categories.get(category).add(key);
            }
        }
    }

    /**
     * Get configuration category for a key
     * @param {string} key - Configuration key
     * @returns {string|null} Category name or null if not found
     */
    getConfigCategory(key) {
        for (const [category, keys] of this.categories.entries()) {
            if (keys.has(key)) {
                return category;
            }
        }
        return null;
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key
     * @returns {any} Configuration value
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Get configuration category values
     * @param {string} category - Category name
     * @returns {Object} Category configuration
     */
    getCategory(category) {
        if (!this.categories.has(category)) {
            throw new Error(`Invalid category: ${category}`);
        }

        const config = {};
        for (const key of this.categories.get(category)) {
            config[key] = this.config[key];
        }
        return config;
    }

    /**
     * Generate a secure secret
     * @param {number} length - Secret length
     * @returns {string} Generated secret
     */
    generateSecret(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Initialize database connection
     * @returns {Promise<void>}
     */
    async initializeDatabase() {
        const connect = async () => {
            try {
                await mongoose.connect(this.config.MONGODB_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    poolSize: this.config.DB_POOL_SIZE,
                    socketTimeoutMS: this.config.DB_SOCKET_TIMEOUT
                });
                logger.info('Connected to MongoDB');
            } catch (error) {
                logger.error('Failed to connect to MongoDB:', error);
                throw error;
            }
        };

        let attempts = 0;
        while (attempts < this.config.MAX_DB_RECONNECT_ATTEMPTS) {
            try {
                await connect();
                return;
            } catch (error) {
                attempts++;
                if (attempts === this.config.MAX_DB_RECONNECT_ATTEMPTS) {
                    throw error;
                }
                logger.warn(`Retrying database connection (${attempts}/${this.config.MAX_DB_RECONNECT_ATTEMPTS})`);
                await new Promise(resolve => setTimeout(resolve, this.config.DB_RECONNECT_INTERVAL));
            }
        }
    }

    /**
     * Validate configuration value
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     * @returns {any} Validated value
     */
    validateConfigValue(key, value) {
        if (key in validators) {
            return validators[key](value);
        }
        return value;
    }

    /**
     * Update configuration value
     * @param {string} key - Configuration key
     * @param {any} value - New value
     */
    updateConfigValue(key, value) {
        if (key in defaults) {
            this.config[key] = this.validateConfigValue(key, value);
            logger.info(`Updated configuration: ${key}`);
        } else {
            throw new Error(`Invalid configuration key: ${key}`);
        }
    }

    /**
     * Update configuration category
     * @param {string} category - Category name
     * @param {Object} values - Category values
     */
    updateCategory(category, values) {
        if (!this.categories.has(category)) {
            throw new Error(`Invalid category: ${category}`);
        }

        for (const [key, value] of Object.entries(values)) {
            if (this.categories.get(category).has(key)) {
                this.updateConfigValue(key, value);
            }
        }
    }

    /**
     * Get all configuration values
     * @returns {Object} All configuration values
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Get configuration categories
     * @returns {Object} Configuration categories
     */
    getCategories() {
        const categories = {};
        for (const [category, keys] of this.categories.entries()) {
            categories[category] = Array.from(keys);
        }
        return categories;
    }

    /**
     * Get configuration schema
     * @returns {Object} Configuration schema
     */
    getSchema() {
        const schema = {};
        for (const [key, value] of Object.entries(defaults)) {
            schema[key] = {
                type: typeof value,
                category: this.getConfigCategory(key),
                default: value,
                validator: key in validators ? validators[key].toString() : null
            };
        }
        return schema;
    }

    /**
     * Export configuration
     * @returns {Object} Exported configuration
     */
    export() {
        return {
            config: this.getAll(),
            categories: this.getCategories(),
            schema: this.getSchema()
        };
    }

    /**
     * Import configuration
     * @param {Object} data - Configuration data
     */
    import(data) {
        if (data.config) {
            for (const [key, value] of Object.entries(data.config)) {
                if (key in defaults) {
                    this.updateConfigValue(key, value);
                }
            }
        }
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = this.initializeConfig();
        logger.info('Configuration reset to defaults');
    }

    /**
     * Backup configuration
     * @returns {Object} Backup data
     */
    backup() {
        return {
            timestamp: Date.now(),
            config: this.getAll(),
            categories: this.getCategories(),
            schema: this.getSchema()
        };
    }

    /**
     * Restore configuration from backup
     * @param {Object} backup - Backup data
     */
    restore(backup) {
        if (backup.config) {
            this.import(backup);
            logger.info('Configuration restored from backup');
        } else {
            throw new Error('Invalid backup data');
        }
    }

    /**
     * Migrate configuration
     * @param {Object} source - Source configuration
     * @param {Object} target - Target configuration
     */
    migrate(source, target) {
        const sourceConfig = new ConfigManager();
        sourceConfig.import(source);
        const targetConfig = new ConfigManager();
        targetConfig.import(target);

        const migration = {
            timestamp: Date.now(),
            source: sourceConfig.export(),
            target: targetConfig.export(),
            changes: {}
        };

        for (const [key, value] of Object.entries(sourceConfig.getAll())) {
            if (targetConfig.get(key) !== value) {
                migration.changes[key] = {
                    from: value,
                    to: targetConfig.get(key)
                };
            }
        }

        return migration;
    }

    /**
     * Sync configuration with another instance
     * @param {Object} remote - Remote configuration
     */
    sync(remote) {
        const local = this.export();
        const changes = {};

        for (const [key, value] of Object.entries(remote.config)) {
            if (local.config[key] !== value) {
                changes[key] = {
                    from: local.config[key],
                    to: value
                };
                this.updateConfigValue(key, value);
            }
        }

        return {
            timestamp: Date.now(),
            changes
        };
    }

    /**
     * Update configuration from file
     * @param {string} path - File path
     */
    async updateFromFile(path) {
        try {
            const data = await fs.promises.readFile(path, 'utf8');
            const config = JSON.parse(data);
            this.import(config);
            logger.info(`Configuration updated from file: ${path}`);
        } catch (error) {
            logger.error(`Failed to update configuration from file: ${path}`, error);
            throw error;
        }
    }

    /**
     * Save configuration to file
     * @param {string} path - File path
     */
    async saveToFile(path) {
        try {
            const data = JSON.stringify(this.export(), null, 2);
            await fs.promises.writeFile(path, data, 'utf8');
            logger.info(`Configuration saved to file: ${path}`);
        } catch (error) {
            logger.error(`Failed to save configuration to file: ${path}`, error);
            throw error;
        }
    }

    /**
     * Download configuration
     * @returns {string} Configuration data
     */
    download() {
        return JSON.stringify(this.export(), null, 2);
    }

    /**
     * Upload configuration
     * @param {string} data - Configuration data
     */
    upload(data) {
        try {
            const config = JSON.parse(data);
            this.import(config);
            logger.info('Configuration uploaded');
        } catch (error) {
            logger.error('Failed to upload configuration', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const configManager = new ConfigManager();
export default configManager; 