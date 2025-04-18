import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Validate required environment variables
const requiredKeys = [
    'PORT',
    'RUST_SERVER_IP',
    'RUST_SERVER_PORT',
    'RUST_SERVER_PLAYER_TOKEN',
    'RUST_SERVER_STEAM_ID'
];

const missingKeys = requiredKeys.filter(key => !process.env[key]);
if (missingKeys.length > 0) {
    logger.error('Missing required environment variables:', missingKeys);
    process.exit(1);
}

// Default configuration
const config = {
    // Server Configuration
    PORT: parseInt(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Rust+ Server Configuration
    RUST_SERVER_IP: process.env.RUST_SERVER_IP,
    RUST_SERVER_PORT: parseInt(process.env.RUST_SERVER_PORT),
    RUST_SERVER_PLAYER_TOKEN: process.env.RUST_SERVER_PLAYER_TOKEN,
    RUST_SERVER_STEAM_ID: process.env.RUST_SERVER_STEAM_ID,

    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT) || 27017,
    DB_NAME: process.env.DB_NAME || 'kinabot',
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,

    // Authentication Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    SESSION_SECRET: process.env.SESSION_SECRET,

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/kinabot.log',

    // Frontend Configuration
    VITE_SOCKET_URL: process.env.VITE_SOCKET_URL || 'http://localhost:3000',
    VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3000/api',

    // Security Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '15m',
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // Storage Configuration
    STORAGE_PATH: process.env.STORAGE_PATH || './data',
    BACKUP_PATH: process.env.BACKUP_PATH || './backups',
    BACKUP_INTERVAL: process.env.BACKUP_INTERVAL || '24h',

    // Notification Configuration
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
};

// Log successful configuration load
logger.info('Configuration loaded successfully');

export default config; 