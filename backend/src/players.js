import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { logger } from './utils/logger.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Constants
const PLAYERS_FILE = 'players.json';
const PLAYERS_PATH = path.join(__dirname, '../../data', PLAYERS_FILE);
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// State management
let trackedPlayers = new Map();
let saveInterval = null;
let rustPlus = null;

/**
 * Load players from file
 * @returns {Promise<void>}
 */
async function loadPlayers() {
    try {
        if (!fs.existsSync(PLAYERS_PATH)) {
            logger.info('No existing player data found, starting fresh');
            return;
        }

        const data = await fs.promises.readFile(PLAYERS_PATH, 'utf8');
        trackedPlayers = new Map(JSON.parse(data));
        logger.info('Player data loaded', { count: trackedPlayers.size });
    } catch (error) {
        logger.error('Error loading player data:', error);
        throw new Error('Failed to load player data');
    }
}

/**
 * Save players to file
 * @returns {Promise<void>}
 */
async function savePlayers() {
    try {
        const data = JSON.stringify([...trackedPlayers], null, 2);
        await fs.promises.writeFile(PLAYERS_PATH, data);
        logger.debug('Player data saved', { count: trackedPlayers.size });
    } catch (error) {
        logger.error('Error saving player data:', error);
        throw new Error('Failed to save player data');
    }
}

/**
 * Start auto-saving player data
 */
function startAutoSave() {
    if (saveInterval) {
        clearInterval(saveInterval);
    }

    saveInterval = setInterval(async () => {
        try {
            await savePlayers();
        } catch (error) {
            logger.error('Auto-save failed:', error);
        }
    }, SAVE_INTERVAL);

    logger.info('Auto-save started', { interval: SAVE_INTERVAL });
}

/**
 * Stop auto-saving player data
 */
function stopAutoSave() {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
        logger.info('Auto-save stopped');
    }
}

/**
 * Add a player to tracking
 * @param {string} steamId - Player's Steam ID
 * @param {string} name - Player's name
 * @returns {Promise<void>}
 */
async function addPlayer(steamId, name) {
    try {
        if (!trackedPlayers.has(steamId)) {
            trackedPlayers.set(steamId, {
                steamId,
                name,
                lastSeen: null,
                isOnline: false,
                lastLocation: null,
                joinCount: 0,
                totalPlayTime: 0,
                lastPlayTime: 0
            });
            await savePlayers();
            logger.info('Player added', { steamId, name });
        }
    } catch (error) {
        logger.error('Error adding player:', error);
        throw new Error('Failed to add player');
    }
}

/**
 * Remove a player from tracking
 * @param {string} steamId - Player's Steam ID
 * @returns {Promise<void>}
 */
async function removePlayer(steamId) {
    try {
        if (trackedPlayers.has(steamId)) {
            trackedPlayers.delete(steamId);
            await savePlayers();
            logger.info('Player removed', { steamId });
        }
    } catch (error) {
        logger.error('Error removing player:', error);
        throw new Error('Failed to remove player');
    }
}

/**
 * Update player status
 * @param {string} steamId - Player's Steam ID
 * @param {boolean} isOnline - Whether the player is online
 * @param {Object} [location] - Player's location
 * @returns {Promise<void>}
 */
async function updatePlayerStatus(steamId, isOnline, location = null) {
    try {
        const player = trackedPlayers.get(steamId);
        if (!player) {
            throw new Error('Player not found');
        }

        const wasOnline = player.isOnline;
        player.isOnline = isOnline;
        player.lastSeen = new Date().toISOString();

        if (location) {
            player.lastLocation = location;
        }

        if (isOnline && !wasOnline) {
            player.joinCount++;
            player.lastPlayTime = Date.now();
        } else if (!isOnline && wasOnline) {
            player.totalPlayTime += Date.now() - player.lastPlayTime;
        }

        await savePlayers();
        logger.debug('Player status updated', { steamId, isOnline, location });
    } catch (error) {
        logger.error('Error updating player status:', error);
        throw new Error('Failed to update player status');
    }
}

/**
 * Get all tracked players
 * @returns {Array} - List of players
 */
function getPlayers() {
    return Array.from(trackedPlayers.values());
}

/**
 * Get player by Steam ID
 * @param {string} steamId - Player's Steam ID
 * @returns {Object|null} - Player data or null if not found
 */
function getPlayer(steamId) {
    return trackedPlayers.get(steamId) || null;
}

/**
 * Initialize players module
 * @returns {Promise<void>}
 */
async function initialize() {
    try {
        await loadPlayers();
        startAutoSave();
        logger.info('Players module initialized');
    } catch (error) {
        logger.error('Failed to initialize players module:', error);
        throw error;
    }
}

/**
 * Cleanup players module
 * @returns {Promise<void>}
 */
async function cleanup() {
    try {
        stopAutoSave();
        await savePlayers();
        logger.info('Players module cleaned up');
    } catch (error) {
        logger.error('Error during cleanup:', error);
        throw error;
    }
}

/**
 * Initialize Rust+ connection
 * @param {string} ip - Server IP
 * @param {number} port - Server port
 * @param {string} playerId - Player ID
 * @param {string} playerToken - Player token
 * @returns {Promise<void>}
 */
async function initializeRustPlus(ip, port, playerId, playerToken) {
    try {
        rustPlus = new RustPlus(ip, port, playerId, playerToken);
        await rustPlus.connect();
        logger.info('Rust+ connection initialized');
    } catch (error) {
        logger.error('Failed to initialize Rust+ connection:', error);
        throw new Error('Failed to initialize Rust+ connection');
    }
}

export {
    initialize,
    cleanup,
    addPlayer,
    removePlayer,
    updatePlayerStatus,
    getPlayers,
    getPlayer,
    initializeRustPlus
}; 