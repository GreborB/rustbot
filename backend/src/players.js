/**
 * Player management service
 * @module players
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { loggerInstance as logger } from './utils/logger.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Player configuration
const PLAYER_CONFIG = {
    FILE_NAME: 'players.json',
    SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_PLAYERS: 1000,
    MAX_NAME_LENGTH: 32,
    LOCATION_UPDATE_INTERVAL: 30 * 1000, // 30 seconds
    PLAYER_CLEANUP_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
    PLAYER_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000 // 24 hours
};

class PlayerManager {
    constructor() {
        this.trackedPlayers = new Map();
        this.saveInterval = null;
        this.cleanupInterval = null;
        this.rustPlus = null;
        this.locationUpdateInterval = null;
        this.playersPath = path.join(__dirname, '../../data', PLAYER_CONFIG.FILE_NAME);
    }

    /**
     * Load players from file
     * @returns {Promise<void>}
     */
    async loadPlayers() {
        try {
            if (!fs.existsSync(this.playersPath)) {
                logger.info('No existing player data found, starting fresh');
                return;
            }

            const data = await fs.promises.readFile(this.playersPath, 'utf8');
            const parsedData = JSON.parse(data);
            
            // Validate and sanitize loaded data
            const validPlayers = parsedData.filter(([steamId, player]) => {
                return this.validatePlayerData(steamId, player);
            });

            this.trackedPlayers = new Map(validPlayers);
            logger.info('Player data loaded', { count: this.trackedPlayers.size });
        } catch (error) {
            logger.error('Error loading player data:', error);
            throw new Error('Failed to load player data');
        }
    }

    /**
     * Validate player data
     * @param {string} steamId - Player's Steam ID
     * @param {Object} player - Player data
     * @returns {boolean} - Whether the data is valid
     */
    validatePlayerData(steamId, player) {
        return (
            typeof steamId === 'string' &&
            steamId.length > 0 &&
            typeof player === 'object' &&
            player !== null &&
            typeof player.name === 'string' &&
            player.name.length <= PLAYER_CONFIG.MAX_NAME_LENGTH &&
            typeof player.isOnline === 'boolean' &&
            typeof player.joinCount === 'number' &&
            typeof player.totalPlayTime === 'number'
        );
    }

    /**
     * Save players to file
     * @returns {Promise<void>}
     */
    async savePlayers() {
        try {
            const data = JSON.stringify([...this.trackedPlayers], null, 2);
            await fs.promises.writeFile(this.playersPath, data);
            logger.debug('Player data saved', { count: this.trackedPlayers.size });
        } catch (error) {
            logger.error('Error saving player data:', error);
            throw new Error('Failed to save player data');
        }
    }

    /**
     * Start auto-saving player data
     */
    startAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }

        this.saveInterval = setInterval(async () => {
            try {
                await this.savePlayers();
            } catch (error) {
                logger.error('Auto-save failed:', error);
            }
        }, PLAYER_CONFIG.SAVE_INTERVAL);

        logger.info('Auto-save started', { interval: PLAYER_CONFIG.SAVE_INTERVAL });
    }

    /**
     * Start player cleanup
     */
    startPlayerCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupInactivePlayers();
            } catch (error) {
                logger.error('Player cleanup failed:', error);
            }
        }, PLAYER_CONFIG.PLAYER_CLEANUP_INTERVAL);

        logger.info('Player cleanup started', { interval: PLAYER_CONFIG.PLAYER_CLEANUP_INTERVAL });
    }

    /**
     * Cleanup inactive players
     * @returns {Promise<void>}
     */
    async cleanupInactivePlayers() {
        try {
            const now = Date.now();
            let removedCount = 0;

            for (const [steamId, player] of this.trackedPlayers.entries()) {
                if (!player.lastSeen || now - new Date(player.lastSeen).getTime() > PLAYER_CONFIG.PLAYER_CLEANUP_AGE) {
                    this.trackedPlayers.delete(steamId);
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                await this.savePlayers();
                logger.info('Inactive players cleaned up', { count: removedCount });
            }
        } catch (error) {
            logger.error('Error cleaning up inactive players:', error);
            throw error;
        }
    }

    /**
     * Add a player to tracking
     * @param {string} steamId - Player's Steam ID
     * @param {string} name - Player's name
     * @returns {Promise<void>}
     */
    async addPlayer(steamId, name) {
        try {
            if (this.trackedPlayers.size >= PLAYER_CONFIG.MAX_PLAYERS) {
                throw new Error('Maximum number of tracked players reached');
            }

            if (!steamId || !name) {
                throw new Error('Invalid player data');
            }

            if (name.length > PLAYER_CONFIG.MAX_NAME_LENGTH) {
                name = name.substring(0, PLAYER_CONFIG.MAX_NAME_LENGTH);
            }

            if (!this.trackedPlayers.has(steamId)) {
                this.trackedPlayers.set(steamId, {
                    steamId,
                    name,
                    lastSeen: null,
                    isOnline: false,
                    lastLocation: null,
                    joinCount: 0,
                    totalPlayTime: 0,
                    lastPlayTime: 0,
                    lastKnownHealth: 100,
                    lastKnownPosition: null,
                    lastKnownRotation: null,
                    lastKnownTeam: null,
                    lastKnownClan: null,
                    lastKnownWeapon: null,
                    lastKnownInventory: null
                });
                await this.savePlayers();
                logger.info('Player added', { steamId, name });
            }
        } catch (error) {
            logger.error('Error adding player:', error);
            throw error;
        }
    }

    /**
     * Remove a player from tracking
     * @param {string} steamId - Player's Steam ID
     * @returns {Promise<void>}
     */
    async removePlayer(steamId) {
        try {
            if (this.trackedPlayers.has(steamId)) {
                this.trackedPlayers.delete(steamId);
                await this.savePlayers();
                logger.info('Player removed', { steamId });
            }
        } catch (error) {
            logger.error('Error removing player:', error);
            throw error;
        }
    }

    /**
     * Update player status
     * @param {string} steamId - Player's Steam ID
     * @param {boolean} isOnline - Whether the player is online
     * @param {Object} [location] - Player's location
     * @param {Object} [stats] - Additional player stats
     * @returns {Promise<void>}
     */
    async updatePlayerStatus(steamId, isOnline, location = null, stats = {}) {
        try {
            const player = this.trackedPlayers.get(steamId);
            if (!player) {
                throw new Error('Player not found');
            }

            const wasOnline = player.isOnline;
            player.isOnline = isOnline;
            player.lastSeen = new Date().toISOString();

            if (location) {
                player.lastLocation = location;
            }

            // Update additional stats if provided
            if (stats.health !== undefined) player.lastKnownHealth = stats.health;
            if (stats.position) player.lastKnownPosition = stats.position;
            if (stats.rotation) player.lastKnownRotation = stats.rotation;
            if (stats.team) player.lastKnownTeam = stats.team;
            if (stats.clan) player.lastKnownClan = stats.clan;
            if (stats.weapon) player.lastKnownWeapon = stats.weapon;
            if (stats.inventory) player.lastKnownInventory = stats.inventory;

            if (isOnline && !wasOnline) {
                player.joinCount++;
                player.lastPlayTime = Date.now();
            } else if (!isOnline && wasOnline) {
                player.totalPlayTime += Date.now() - player.lastPlayTime;
            }

            await this.savePlayers();
            logger.debug('Player status updated', { steamId, isOnline, location, stats });
        } catch (error) {
            logger.error('Error updating player status:', error);
            throw error;
        }
    }

    /**
     * Get all tracked players
     * @param {Object} [filters] - Filter options
     * @returns {Array} - List of players
     */
    getPlayers(filters = {}) {
        let players = Array.from(this.trackedPlayers.values());

        if (filters.online !== undefined) {
            players = players.filter(p => p.isOnline === filters.online);
        }

        if (filters.team) {
            players = players.filter(p => p.lastKnownTeam === filters.team);
        }

        if (filters.clan) {
            players = players.filter(p => p.lastKnownClan === filters.clan);
        }

        return players;
    }

    /**
     * Get player by Steam ID
     * @param {string} steamId - Player's Steam ID
     * @returns {Object|null} - Player data or null if not found
     */
    getPlayer(steamId) {
        return this.trackedPlayers.get(steamId) || null;
    }

    /**
     * Start location updates
     */
    startLocationUpdates() {
        if (this.locationUpdateInterval) {
            clearInterval(this.locationUpdateInterval);
        }

        this.locationUpdateInterval = setInterval(async () => {
            try {
                if (this.rustPlus) {
                    const players = this.getPlayers({ online: true });
                    for (const player of players) {
                        try {
                            const info = await this.rustPlus.getEntityInfo(player.steamId);
                            if (info) {
                                await this.updatePlayerStatus(player.steamId, true, {
                                    x: info.position.x,
                                    y: info.position.y,
                                    z: info.position.z
                                }, {
                                    health: info.health,
                                    rotation: info.rotation
                                });
                            }
                        } catch (error) {
                            logger.error(`Error updating player location: ${player.steamId}`, error);
                        }
                    }
                }
            } catch (error) {
                logger.error('Error in location update loop:', error);
            }
        }, PLAYER_CONFIG.LOCATION_UPDATE_INTERVAL);

        logger.info('Location updates started', { interval: PLAYER_CONFIG.LOCATION_UPDATE_INTERVAL });
    }

    /**
     * Initialize players module
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            await this.loadPlayers();
            this.startAutoSave();
            this.startPlayerCleanup();
            logger.info('Players module initialized');
        } catch (error) {
            logger.error('Failed to initialize players module:', error);
            throw error;
        }
    }

    /**
     * Initialize Rust+ connection
     * @param {Object} params - Connection parameters
     * @returns {Promise<void>}
     */
    async initializeRustPlus({ ip, port, playerId, playerToken }) {
        try {
            if (this.rustPlus) {
                await this.rustPlus.disconnect();
            }

            this.rustPlus = new RustPlus(ip, port, playerId, playerToken);
            await this.rustPlus.connect();
            this.startLocationUpdates();
            logger.info('Rust+ connection initialized');
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw new Error('Failed to initialize Rust+ connection');
        }
    }

    /**
     * Cleanup players module
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.saveInterval) {
                clearInterval(this.saveInterval);
                this.saveInterval = null;
            }

            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }

            if (this.locationUpdateInterval) {
                clearInterval(this.locationUpdateInterval);
                this.locationUpdateInterval = null;
            }

            if (this.rustPlus) {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
            }

            await this.savePlayers();
            logger.info('Players module cleaned up');
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const playerManager = new PlayerManager();
export default Object.freeze(playerManager); 