import fs from 'fs';
import path from 'path';
import config from './config.js';
import pkg from '@liamcottle/rustplus.js';
import { loggerInstance as logger } from './utils/logger.js';
const { RustPlus } = pkg;

// Timer configuration
const TIMER_CONFIG = {
    CHECK_INTERVAL: 1000,
    MAX_DURATION: 24 * 60 * 60, // 24 hours in seconds
    MIN_DURATION: 1, // 1 second
    MAX_TIMERS: 100,
    STORAGE_FILE: 'timers.json'
};

class TimerManager {
    constructor() {
        this.activeTimers = new Map();
        this.rustPlus = null;
        this.checkInterval = null;
    }

    /**
     * Initialize timers from storage
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            await this.loadTimers();
            this.startTimerLoop();
            logger.info('Timer manager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize timer manager:', error);
            throw error;
        }
    }

    /**
     * Load timers from storage file
     * @returns {Promise<void>}
     */
    async loadTimers() {
        try {
            const filePath = path.join(path.dirname(config.STORAGE_PATH), TIMER_CONFIG.STORAGE_FILE);
            if (!fs.existsSync(filePath)) {
                logger.info('No existing timer data found, starting fresh');
                return;
            }

            const data = await fs.promises.readFile(filePath, 'utf8');
            const timers = JSON.parse(data);
            
            for (const timer of timers) {
                if (this.validateTimer(timer)) {
                    timer.endTime = new Date(timer.endTime);
                    this.activeTimers.set(timer.id, timer);
                }
            }
            logger.info(`Loaded ${this.activeTimers.size} timers from storage`);
        } catch (error) {
            logger.error('Error loading timers:', error);
            throw new Error('Failed to load timers from storage');
        }
    }

    /**
     * Save timers to storage file
     * @returns {Promise<void>}
     */
    async saveTimers() {
        try {
            const filePath = path.join(path.dirname(config.STORAGE_PATH), TIMER_CONFIG.STORAGE_FILE);
            const data = JSON.stringify(Array.from(this.activeTimers.values()), null, 2);
            await fs.promises.writeFile(filePath, data);
            logger.debug('Timers saved successfully');
        } catch (error) {
            logger.error('Error saving timers:', error);
            throw new Error('Failed to save timers to storage');
        }
    }

    /**
     * Initialize Rust+ connection
     * @param {Object} params - Connection parameters
     * @returns {Promise<void>}
     */
    async initializeRustPlus({ ip, port, playerId, playerToken }) {
        try {
            this.rustPlus = new RustPlus(ip, port, playerId, playerToken);
            await this.rustPlus.connect();
            logger.info('RustPlus connection initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize RustPlus connection:', error);
            throw new Error('Failed to connect to Rust+ server');
        }
    }

    /**
     * Validate timer parameters
     * @param {Object} timer - Timer object to validate
     * @returns {boolean} - Whether the timer is valid
     */
    validateTimer(timer) {
        const requiredFields = ['id', 'name', 'duration', 'endTime', 'message'];
        const missingFields = requiredFields.filter(field => !timer[field]);
        
        if (missingFields.length > 0) {
            logger.warn(`Invalid timer: missing fields ${missingFields.join(', ')}`);
            return false;
        }

        if (timer.duration < TIMER_CONFIG.MIN_DURATION || timer.duration > TIMER_CONFIG.MAX_DURATION) {
            logger.warn(`Invalid timer duration: ${timer.duration}`);
            return false;
        }

        return true;
    }

    /**
     * Add a new timer
     * @param {Object} params - Timer parameters
     * @returns {string} - Timer ID
     */
    addTimer({ name, duration, message, repeat = false }) {
        try {
            if (this.activeTimers.size >= TIMER_CONFIG.MAX_TIMERS) {
                throw new Error('Maximum number of timers reached');
            }

            const timer = {
                id: Date.now().toString(),
                name,
                duration,
                endTime: new Date(Date.now() + duration * 1000),
                message,
                repeat,
                isActive: true
            };

            if (!this.validateTimer(timer)) {
                throw new Error('Invalid timer parameters');
            }

            this.activeTimers.set(timer.id, timer);
            this.saveTimers();
            logger.info(`Timer "${name}" added successfully`);
            return timer.id;
        } catch (error) {
            logger.error('Error adding timer:', error);
            throw error;
        }
    }

    /**
     * Remove a timer
     * @param {string} timerId - ID of timer to remove
     * @returns {boolean} - Whether the timer was removed
     */
    async removeTimer(timerId) {
        try {
            if (this.activeTimers.delete(timerId)) {
                await this.saveTimers();
                logger.info(`Timer ${timerId} removed successfully`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Error removing timer ${timerId}:`, error);
            throw error;
        }
    }

    /**
     * Check and update timers
     * @returns {Promise<void>}
     */
    async checkTimers() {
        if (!this.rustPlus) {
            logger.debug('RustPlus not initialized, skipping timer check');
            return;
        }

        const now = new Date();
        const completedTimers = [];
        let needsSave = false;

        for (const [id, timer] of this.activeTimers) {
            if (!timer.isActive || now < timer.endTime) continue;

            try {
                await this.rustPlus.sendTeamMessage(timer.message);
                logger.info(`Timer "${timer.name}" completed, message sent`);

                if (timer.repeat) {
                    timer.endTime = new Date(Date.now() + timer.duration * 1000);
                    logger.debug(`Timer "${timer.name}" reset for next cycle`);
                } else {
                    timer.isActive = false;
                    completedTimers.push(id);
                }
                needsSave = true;
            } catch (error) {
                logger.error(`Error processing timer "${timer.name}":`, error);
            }
        }

        // Remove completed non-repeating timers
        for (const id of completedTimers) {
            this.activeTimers.delete(id);
        }

        if (needsSave) {
            await this.saveTimers();
        }
    }

    /**
     * Get all active timers
     * @returns {Array} - Array of timer objects
     */
    getTimers() {
        return Array.from(this.activeTimers.values())
            .map(timer => ({
                ...timer,
                timeLeft: Math.max(0, timer.endTime - Date.now()) / 1000
            }));
    }

    /**
     * Start timer checking loop
     */
    startTimerLoop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.checkInterval = setInterval(() => this.checkTimers(), TIMER_CONFIG.CHECK_INTERVAL);
        logger.info('Timer check loop started');
    }

    /**
     * Stop timer checking loop
     */
    stopTimerLoop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.info('Timer check loop stopped');
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopTimerLoop();
        if (this.rustPlus) {
            this.rustPlus.disconnect();
            this.rustPlus = null;
        }
        logger.info('Timer manager cleaned up');
    }
}

// Create and export a singleton instance
const timerManager = new TimerManager();
export default Object.freeze(timerManager); 