/**
 * Logger utility
 * @module logger
 */

import config from '../config.js';

// Log levels
const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Log level colors
const COLORS = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[35m', // Magenta
    reset: '\x1b[0m'   // Reset
};

// Current log level
const currentLevel = LEVELS[config.LOG_LEVEL] || LEVELS.info;

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [metadata] - Additional metadata
 * @returns {string} - Formatted log message
 */
const formatMessage = (level, message, metadata = {}) => {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.reset;
    const metadataStr = Object.keys(metadata).length 
        ? ` ${JSON.stringify(metadata)}` 
        : '';

    return `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}${COLORS.reset}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error|Object} [error] - Error object or metadata
 */
export const error = (message, error) => {
    if (currentLevel >= LEVELS.error) {
        const metadata = error instanceof Error 
            ? { message: error.message, stack: error.stack }
            : error;
        console.error(formatMessage('error', message, metadata));
    }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} [metadata] - Additional metadata
 */
export const warn = (message, metadata) => {
    if (currentLevel >= LEVELS.warn) {
        console.warn(formatMessage('warn', message, metadata));
    }
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} [metadata] - Additional metadata
 */
export const info = (message, metadata) => {
    if (currentLevel >= LEVELS.info) {
        console.info(formatMessage('info', message, metadata));
    }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} [metadata] - Additional metadata
 */
export const debug = (message, metadata) => {
    if (currentLevel >= LEVELS.debug) {
        console.debug(formatMessage('debug', message, metadata));
    }
};

// Export logger object
export const logger = {
    error,
    warn,
    info,
    debug
}; 