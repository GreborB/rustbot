/**
 * Smart switch management service
 * @module switches
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { loggerInstance as logger } from './utils/logger.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Switch configuration
const SWITCH_CONFIG = {
    FILE_NAME: 'switches.json',
    UPDATE_INTERVAL: 30 * 1000, // 30 seconds
    MAX_SWITCHES: 100,
    MAX_NAME_LENGTH: 32,
    STATE_CHANGE_TIMEOUT: 5000, // 5 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
};

class SwitchManager {
    constructor() {
        this.smartSwitches = new Map();
        this.rustPlus = null;
        this.updateInterval = null;
        this.switchesPath = path.join(__dirname, '../../data', SWITCH_CONFIG.FILE_NAME);
        this.stateChangePromises = new Map();
    }

    /**
     * Load switches from file
     * @returns {Promise<void>}
     */
    async loadSwitches() {
        try {
            if (!fs.existsSync(this.switchesPath)) {
                logger.info('No existing switch data found, starting fresh');
                return;
            }

            const data = await fs.promises.readFile(this.switchesPath, 'utf8');
            const parsedData = JSON.parse(data);
            
            // Validate and sanitize loaded data
            const validSwitches = parsedData.filter(([switchId, switchObj]) => {
                return this.validateSwitchData(switchId, switchObj);
            });

            this.smartSwitches = new Map(validSwitches);
            logger.info('Switch data loaded', { count: this.smartSwitches.size });
        } catch (error) {
            logger.error('Error loading switch data:', error);
            throw new Error('Failed to load switch data');
        }
    }

    /**
     * Validate switch data
     * @param {string} switchId - Switch ID
     * @param {Object} switchObj - Switch data
     * @returns {boolean} - Whether the data is valid
     */
    validateSwitchData(switchId, switchObj) {
        return (
            typeof switchId === 'string' &&
            switchId.length > 0 &&
            typeof switchObj === 'object' &&
            switchObj !== null &&
            typeof switchObj.name === 'string' &&
            switchObj.name.length <= SWITCH_CONFIG.MAX_NAME_LENGTH &&
            typeof switchObj.isOn === 'boolean' &&
            typeof switchObj.lastUpdated === 'number'
        );
    }

    /**
     * Save switches to file
     * @returns {Promise<void>}
     */
    async saveSwitches() {
        try {
            const data = JSON.stringify([...this.smartSwitches], null, 2);
            await fs.promises.writeFile(this.switchesPath, data);
            logger.debug('Switch data saved', { count: this.smartSwitches.size });
        } catch (error) {
            logger.error('Error saving switch data:', error);
            throw new Error('Failed to save switch data');
        }
    }

    /**
     * Start switch state updates
     */
    startSwitchUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            try {
                await this.updateAllSwitches();
            } catch (error) {
                logger.error('Error in switch update loop:', error);
            }
        }, SWITCH_CONFIG.UPDATE_INTERVAL);

        logger.info('Switch updates started', { interval: SWITCH_CONFIG.UPDATE_INTERVAL });
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
            this.startSwitchUpdates();
            logger.info('Rust+ connection initialized');
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw new Error('Failed to initialize Rust+ connection');
        }
    }

    /**
     * Add a new smart switch
     * @param {string} switchId - Switch ID
     * @param {string} name - Switch name
     * @returns {Promise<void>}
     */
    async addSwitch(switchId, name) {
        try {
            if (this.smartSwitches.size >= SWITCH_CONFIG.MAX_SWITCHES) {
                throw new Error('Maximum number of switches reached');
            }

            if (!switchId || !name) {
                throw new Error('Invalid switch data');
            }

            if (name.length > SWITCH_CONFIG.MAX_NAME_LENGTH) {
                name = name.substring(0, SWITCH_CONFIG.MAX_NAME_LENGTH);
            }

            if (!this.smartSwitches.has(switchId)) {
                this.smartSwitches.set(switchId, {
                    id: switchId,
                    name,
                    isOn: false,
                    lastUpdated: Date.now(),
                    lastStateChange: null,
                    stateChangeCount: 0,
                    errorCount: 0,
                    lastError: null
                });
                await this.saveSwitches();
                logger.info('Switch added', { switchId, name });
            }
        } catch (error) {
            logger.error('Error adding switch:', error);
            throw error;
        }
    }

    /**
     * Remove a smart switch
     * @param {string} switchId - Switch ID
     * @returns {Promise<void>}
     */
    async removeSwitch(switchId) {
        try {
            if (this.smartSwitches.delete(switchId)) {
                await this.saveSwitches();
                logger.info('Switch removed', { switchId });
            }
        } catch (error) {
            logger.error('Error removing switch:', error);
            throw error;
        }
    }

    /**
     * Toggle switch state with retry logic
     * @param {string} switchId - Switch ID
     * @param {boolean} state - Desired state
     * @returns {Promise<void>}
     */
    async toggleSwitch(switchId, state) {
        try {
            if (!this.rustPlus || !this.smartSwitches.has(switchId)) {
                throw new Error('Switch not found or not connected');
            }

            const switchObj = this.smartSwitches.get(switchId);
            const startTime = Date.now();

            // Check if there's already a pending state change
            if (this.stateChangePromises.has(switchId)) {
                throw new Error('Switch state change already in progress');
            }

            // Create a promise for this state change
            const stateChangePromise = (async () => {
                let attempts = 0;
                let lastError = null;

                while (attempts < SWITCH_CONFIG.RETRY_ATTEMPTS) {
                    try {
                        await this.rustPlus.setEntityValue(switchId, state);
                        
                        switchObj.isOn = state;
                        switchObj.lastUpdated = Date.now();
                        switchObj.lastStateChange = Date.now();
                        switchObj.stateChangeCount++;
                        switchObj.errorCount = 0;
                        switchObj.lastError = null;
                        
                        await this.saveSwitches();
                        logger.info('Switch toggled', { switchId, state });
                        return;
                    } catch (error) {
                        lastError = error;
                        attempts++;
                        if (attempts < SWITCH_CONFIG.RETRY_ATTEMPTS) {
                            await new Promise(resolve => setTimeout(resolve, SWITCH_CONFIG.RETRY_DELAY));
                        }
                    }
                }

                switchObj.errorCount++;
                switchObj.lastError = lastError.message;
                await this.saveSwitches();
                throw lastError;
            })();

            this.stateChangePromises.set(switchId, stateChangePromise);

            try {
                await Promise.race([
                    stateChangePromise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Switch state change timeout')), 
                        SWITCH_CONFIG.STATE_CHANGE_TIMEOUT)
                    )
                ]);
            } finally {
                this.stateChangePromises.delete(switchId);
            }
        } catch (error) {
            logger.error(`Error toggling switch ${switchId}:`, error);
            throw error;
        }
    }

    /**
     * Update switch state from server
     * @param {string} switchId - Switch ID
     * @returns {Promise<void>}
     */
    async updateSwitchState(switchId) {
        try {
            if (!this.rustPlus || !this.smartSwitches.has(switchId)) {
                return;
            }

            const switchObj = this.smartSwitches.get(switchId);
            const state = await this.rustPlus.getEntityValue(switchId);
            
            if (state !== undefined) {
                switchObj.isOn = state;
                switchObj.lastUpdated = Date.now();
                await this.saveSwitches();
                logger.debug('Switch state updated', { switchId, state });
            }
        } catch (error) {
            logger.error(`Error updating switch ${switchId}:`, error);
            throw error;
        }
    }

    /**
     * Update all switch states
     * @returns {Promise<void>}
     */
    async updateAllSwitches() {
        try {
            if (!this.rustPlus) {
                return;
            }

            for (const [switchId] of this.smartSwitches) {
                try {
                    await this.updateSwitchState(switchId);
                } catch (error) {
                    logger.error(`Error updating switch ${switchId}:`, error);
                }
            }
        } catch (error) {
            logger.error('Error updating all switches:', error);
            throw error;
        }
    }

    /**
     * Get all smart switches
     * @param {Object} [filters] - Filter options
     * @returns {Array} - List of switches
     */
    getSwitches(filters = {}) {
        let switches = Array.from(this.smartSwitches.values());

        if (filters.isOn !== undefined) {
            switches = switches.filter(s => s.isOn === filters.isOn);
        }

        if (filters.hasError) {
            switches = switches.filter(s => s.errorCount > 0);
        }

        return switches;
    }

    /**
     * Cleanup switch manager
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            if (this.rustPlus) {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
            }

            await this.saveSwitches();
            logger.info('Switch manager cleaned up');
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const switchManager = new SwitchManager();
export default Object.freeze(switchManager); 