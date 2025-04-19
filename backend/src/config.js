/**
 * Configuration module
 * @module config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables before any other operations
dotenv.config({ path: join(__dirname, '../../.env') });

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
    DB_PATH: './database.sqlite',
    DB_LOGGING: false,

    // Authentication configuration
    JWT_SECRET: 'your-secure-auth-secret',
    JWT_EXPIRES_IN: '24h',
    JWT_REFRESH_IN: '7d',
    AUTH_SALT_ROUNDS: 10,

    // Security configuration
    CORS_ORIGIN: 'http://localhost:3001',
    SESSION_SECRET: 'your-secure-session-secret',
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100,

    // Logging configuration
    LOG_LEVEL: 'info',
    LOG_FILE: 'kinabot.log',
    LOG_MAX_SIZE: '10mb',
    LOG_MAX_FILES: 5,
    LOG_FORMAT: 'json',

    // Rust server configuration
    RUST_SERVER_IP: '127.0.0.1',
    RUST_SERVER_PORT: 28015,
    RUST_SERVER_PLAYER_TOKEN: '',
    RUST_SERVER_STEAM_ID: '',
    RUST_RECONNECT_INTERVAL: 5000,
    RUST_MAX_RECONNECT_ATTEMPTS: 5,
    RUST_COMMAND_TIMEOUT: 10000
};

// Configuration validators
const validators = {
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
    JWT_SECRET: (value) => {
        if (!value || value.length < 32) {
            throw new Error('JWT secret must be at least 32 characters');
        }
        return value;
    },
    AUTH_SALT_ROUNDS: (value) => {
        const rounds = parseInt(value, 10);
        if (isNaN(rounds) || rounds < 10 || rounds > 20) {
            throw new Error('Invalid salt rounds value');
        }
        return rounds;
    }
};

class ConfigManager {
    constructor() {
        this.config = {};
        this.initializeConfig();
    }

    initializeConfig() {
        // Load environment variables
        for (const [key, defaultValue] of Object.entries(defaults)) {
            const envValue = process.env[key];
            
            if (envValue !== undefined) {
                // Validate and transform if validator exists
                if (validators[key]) {
                    try {
                        this.config[key] = validators[key](envValue);
                    } catch (error) {
                        console.warn(`Invalid value for ${key}, using default:`, error.message);
                        this.config[key] = defaultValue;
                    }
                } else {
                    this.config[key] = envValue;
                }
            } else {
                this.config[key] = defaultValue;
            }
        }

        // Generate secrets if not provided
        if (this.config.JWT_SECRET === 'your-secure-auth-secret') {
            this.config.JWT_SECRET = crypto.randomBytes(32).toString('hex');
        }
        if (this.config.SESSION_SECRET === 'your-secure-session-secret') {
            this.config.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
        }
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        if (validators[key]) {
            this.config[key] = validators[key](value);
        } else {
            this.config[key] = value;
        }
    }
}

export default new ConfigManager(); 