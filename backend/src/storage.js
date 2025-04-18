/**
 * Storage management service
 * @module storage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;
import { loggerInstance as logger } from './utils/logger.js';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storage configuration
const STORAGE_CONFIG = {
    FILE_NAME: 'storage.json',
    BACKUP_FILE: 'storage.backup.json',
    SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    MAX_BOXES: 1000,
    MAX_ITEMS_PER_BOX: 1000,
    MAX_ITEM_NAME_LENGTH: 64,
    MAX_BOX_NAME_LENGTH: 32,
    MAX_QUANTITY: 1000000,
    SEARCH_CACHE_TTL: 5 * 60 * 1000 // 5 minutes
};

class StorageManager {
    constructor() {
        this.storageBoxes = new Map();
        this.rustPlus = null;
        this.saveInterval = null;
        this.backupInterval = null;
        this.isInitialized = false;
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.fileLock = false;
        this.storagePath = path.join(config.STORAGE_PATH, STORAGE_CONFIG.FILE_NAME);
        this.backupPath = path.join(config.STORAGE_PATH, STORAGE_CONFIG.BACKUP_FILE);
        this.searchCache = new Map();
        this.lastSearchUpdate = 0;
    }

    /**
     * Validate box data
     * @param {Object} box - Box data to validate
     * @throws {Error} If validation fails
     */
    validateBoxData(box) {
        if (!box || typeof box !== 'object') {
            throw new Error('Invalid box data');
        }

        if (!box.name || typeof box.name !== 'string') {
            throw new Error('Invalid box name');
        }

        if (box.name.length > STORAGE_CONFIG.MAX_BOX_NAME_LENGTH) {
            throw new Error('Box name too long');
        }

        if (!Array.isArray(box.items)) {
            throw new Error('Invalid box items');
        }

        if (box.items.length > STORAGE_CONFIG.MAX_ITEMS_PER_BOX) {
            throw new Error('Too many items in box');
        }

        for (const item of box.items) {
            if (!item.itemId || !item.quantity || !item.name) {
                throw new Error('Invalid item data');
            }

            if (item.name.length > STORAGE_CONFIG.MAX_ITEM_NAME_LENGTH) {
                throw new Error('Item name too long');
            }

            if (item.quantity > STORAGE_CONFIG.MAX_QUANTITY) {
                throw new Error('Item quantity too large');
            }
        }
    }

    /**
     * Acquire file lock
     * @returns {Promise<boolean>} - Whether lock was acquired
     */
    async acquireLock() {
        if (this.fileLock) {
            return false;
        }
        this.fileLock = true;
        return true;
    }

    /**
     * Release file lock
     */
    releaseLock() {
        this.fileLock = false;
    }

    /**
     * Create backup of storage data
     * @returns {Promise<void>}
     */
    async createBackup() {
        try {
            if (!fs.existsSync(this.storagePath)) {
                return;
            }

            const data = await fs.promises.readFile(this.storagePath, 'utf8');
            await fs.promises.writeFile(this.backupPath, data, 'utf8');
            logger.info('Storage backup created');
        } catch (error) {
            logger.error('Error creating backup:', error);
            throw error;
        }
    }

    /**
     * Restore from backup if needed
     * @returns {Promise<void>}
     */
    async restoreFromBackup() {
        try {
            if (!fs.existsSync(this.backupPath)) {
                return;
            }

            const backupData = await fs.promises.readFile(this.backupPath, 'utf8');
            const backupHash = crypto.createHash('sha256').update(backupData).digest('hex');
            
            if (fs.existsSync(this.storagePath)) {
                const currentData = await fs.promises.readFile(this.storagePath, 'utf8');
                const currentHash = crypto.createHash('sha256').update(currentData).digest('hex');
                
                if (backupHash === currentHash) {
                    return;
                }
            }

            await fs.promises.writeFile(this.storagePath, backupData, 'utf8');
            logger.info('Storage restored from backup');
        } catch (error) {
            logger.error('Error restoring from backup:', error);
            throw error;
        }
    }

    /**
     * Ensure storage directory exists
     * @returns {Promise<void>}
     */
    async ensureStorageDirectory() {
        try {
            await fs.promises.mkdir(config.STORAGE_PATH, { recursive: true });
        } catch (error) {
            logger.error('Error creating storage directory:', error);
            throw error;
        }
    }

    /**
     * Load storage data from file with retries
     * @returns {Promise<void>}
     */
    async loadStorage() {
        let retries = 0;
        while (retries < STORAGE_CONFIG.MAX_RETRIES) {
            try {
                if (!await this.acquireLock()) {
                    throw new Error('Could not acquire file lock');
                }

                await this.ensureStorageDirectory();
                await this.restoreFromBackup();
                
                if (!fs.existsSync(this.storagePath)) {
                    logger.info('No existing storage data found, starting fresh');
                    return;
                }

                const data = await fs.promises.readFile(this.storagePath, 'utf8');
                const parsedData = JSON.parse(data);
                
                // Validate all boxes
                const validBoxes = [];
                for (const [boxId, box] of parsedData) {
                    try {
                        this.validateBoxData(box);
                        validBoxes.push([boxId, box]);
                    } catch (error) {
                        logger.error(`Invalid box data for box ${boxId}:`, error);
                    }
                }

                this.storageBoxes = new Map(validBoxes);
                logger.info('Storage data loaded', { count: this.storageBoxes.size });
                return;
            } catch (error) {
                retries++;
                if (retries === STORAGE_CONFIG.MAX_RETRIES) {
                    logger.error('Max retries reached loading storage data:', error);
                    throw error;
                }
                logger.warn(`Retry ${retries}/${STORAGE_CONFIG.MAX_RETRIES} loading storage data`);
                await new Promise(resolve => setTimeout(resolve, STORAGE_CONFIG.RETRY_DELAY));
            } finally {
                this.releaseLock();
            }
        }
    }

    /**
     * Save storage data to file with retries
     * @returns {Promise<void>}
     */
    async saveStorage() {
        let retries = 0;
        while (retries < STORAGE_CONFIG.MAX_RETRIES) {
            try {
                if (!await this.acquireLock()) {
                    throw new Error('Could not acquire file lock');
                }

                await this.ensureStorageDirectory();
                const data = JSON.stringify(Array.from(this.storageBoxes.entries()), null, 2);
                await fs.promises.writeFile(this.storagePath, data, 'utf8');
                logger.info('Storage data saved', { count: this.storageBoxes.size });
                return;
            } catch (error) {
                retries++;
                if (retries === STORAGE_CONFIG.MAX_RETRIES) {
                    logger.error('Max retries reached saving storage data:', error);
                    throw error;
                }
                logger.warn(`Retry ${retries}/${STORAGE_CONFIG.MAX_RETRIES} saving storage data`);
                await new Promise(resolve => setTimeout(resolve, STORAGE_CONFIG.RETRY_DELAY));
            } finally {
                this.releaseLock();
            }
        }
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        this.saveInterval = setInterval(async () => {
            try {
                await this.saveStorage();
            } catch (error) {
                logger.error('Error in auto-save:', error);
            }
        }, STORAGE_CONFIG.SAVE_INTERVAL);
        logger.info('Auto-save started', { interval: STORAGE_CONFIG.SAVE_INTERVAL });
    }

    /**
     * Start backup interval
     */
    startBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        this.backupInterval = setInterval(async () => {
            try {
                await this.createBackup();
            } catch (error) {
                logger.error('Error in backup:', error);
            }
        }, STORAGE_CONFIG.BACKUP_INTERVAL);
        logger.info('Backup started', { interval: STORAGE_CONFIG.BACKUP_INTERVAL });
    }

    /**
     * Stop auto-save interval
     */
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
            logger.info('Auto-save stopped');
        }
    }

    /**
     * Stop backup interval
     */
    stopBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
            logger.info('Backup stopped');
        }
    }

    /**
     * Check if cache entry is valid
     * @param {string} key - Cache key
     * @returns {boolean} - Whether cache is valid
     */
    isCacheValid(key) {
        const timestamp = this.cacheTimestamps.get(key);
        if (!timestamp) return false;
        return Date.now() - timestamp < STORAGE_CONFIG.CACHE_TTL;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} - Cached value or null
     */
    getFromCache(key) {
        if (this.isCacheValid(key)) {
            return this.cache.get(key);
        }
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        return null;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    setCache(key, value) {
        this.cache.set(key, value);
        this.cacheTimestamps.set(key, Date.now());
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        logger.info('Cache cleared');
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
            logger.info('Rust+ connection initialized');
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw new Error('Failed to initialize Rust+ connection');
        }
    }

    /**
     * Add a new storage box
     * @param {string} boxId - Box ID
     * @param {string} name - Box name
     * @returns {Promise<void>}
     */
    async addBox(boxId, name) {
        try {
            if (this.storageBoxes.size >= STORAGE_CONFIG.MAX_BOXES) {
                throw new Error('Maximum number of boxes reached');
            }

            if (!boxId || !name) {
                throw new Error('Invalid box data');
            }

            if (name.length > STORAGE_CONFIG.MAX_BOX_NAME_LENGTH) {
                name = name.substring(0, STORAGE_CONFIG.MAX_BOX_NAME_LENGTH);
            }

            if (!this.storageBoxes.has(boxId)) {
                this.storageBoxes.set(boxId, {
                    id: boxId,
                    name,
                    items: [],
                    lastUpdated: Date.now(),
                    lastError: null,
                    errorCount: 0,
                    totalItems: 0,
                    totalValue: 0
                });
                await this.saveStorage();
                logger.info('Storage box added', { boxId, name });
            }
        } catch (error) {
            logger.error('Error adding storage box:', error);
            throw error;
        }
    }

    /**
     * Remove a storage box
     * @param {string} boxId - Box ID
     * @returns {Promise<void>}
     */
    async removeBox(boxId) {
        try {
            if (this.storageBoxes.delete(boxId)) {
                await this.saveStorage();
                logger.info('Storage box removed', { boxId });
            }
        } catch (error) {
            logger.error('Error removing storage box:', error);
            throw error;
        }
    }

    /**
     * Update box contents
     * @param {string} boxId - Box ID
     * @returns {Promise<void>}
     */
    async updateBoxContents(boxId) {
        try {
            if (!this.rustPlus || !this.storageBoxes.has(boxId)) {
                return;
            }

            const box = this.storageBoxes.get(boxId);
            const contents = await this.rustPlus.getEntityInfo(boxId);
            
            if (contents && contents.items) {
                const newItems = [];
                let totalItems = 0;
                let totalValue = 0;

                for (const item of contents.items) {
                    if (totalItems >= STORAGE_CONFIG.MAX_ITEMS_PER_BOX) {
                        logger.warn('Box has too many items, truncating', { boxId });
                        break;
                    }

                    if (item.name.length > STORAGE_CONFIG.MAX_ITEM_NAME_LENGTH) {
                        item.name = item.name.substring(0, STORAGE_CONFIG.MAX_ITEM_NAME_LENGTH);
                    }

                    if (item.quantity > STORAGE_CONFIG.MAX_QUANTITY) {
                        logger.warn('Item quantity exceeds maximum, truncating', { boxId, item: item.name });
                        item.quantity = STORAGE_CONFIG.MAX_QUANTITY;
                    }

                    newItems.push({
                        itemId: item.itemId,
                        name: item.name,
                        quantity: item.quantity
                    });

                    totalItems++;
                    totalValue += item.quantity;
                }

                box.items = newItems;
                box.lastUpdated = Date.now();
                box.errorCount = 0;
                box.lastError = null;
                box.totalItems = totalItems;
                box.totalValue = totalValue;

                await this.saveStorage();
                logger.debug('Box contents updated', { boxId, itemCount: totalItems });
            }
        } catch (error) {
            const box = this.storageBoxes.get(boxId);
            box.errorCount++;
            box.lastError = error.message;
            await this.saveStorage();
            logger.error(`Error updating box ${boxId}:`, error);
            throw error;
        }
    }

    /**
     * Search for items across all boxes
     * @param {string} itemName - Item name to search for
     * @param {Object} [filters] - Search filters
     * @returns {Array} - Search results
     */
    searchItems(itemName, filters = {}) {
        const now = Date.now();
        const cacheKey = `${itemName}-${JSON.stringify(filters)}`;

        // Check cache
        if (this.searchCache.has(cacheKey) && 
            now - this.lastSearchUpdate < STORAGE_CONFIG.SEARCH_CACHE_TTL) {
            return this.searchCache.get(cacheKey);
        }

        const searchTerm = itemName.toLowerCase();
        const results = [];

        for (const [boxId, box] of this.storageBoxes) {
            // Apply box filters
            if (filters.minItems && box.totalItems < filters.minItems) continue;
            if (filters.maxItems && box.totalItems > filters.maxItems) continue;
            if (filters.minValue && box.totalValue < filters.minValue) continue;
            if (filters.maxValue && box.totalValue > filters.maxValue) continue;
            if (filters.hasError && box.errorCount === 0) continue;

            for (const item of box.items) {
                // Apply item filters
                if (filters.minQuantity && item.quantity < filters.minQuantity) continue;
                if (filters.maxQuantity && item.quantity > filters.maxQuantity) continue;

                if (item.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        boxId,
                        boxName: box.name,
                        item: item.name,
                        quantity: item.quantity,
                        lastUpdated: box.lastUpdated,
                        errorCount: box.errorCount,
                        lastError: box.lastError
                    });
                }
            }
        }

        // Sort results
        if (filters.sortBy) {
            results.sort((a, b) => {
                if (filters.sortBy === 'quantity') return a.quantity - b.quantity;
                if (filters.sortBy === 'lastUpdated') return b.lastUpdated - a.lastUpdated;
                return 0;
            });
        }

        // Cache results
        this.searchCache.set(cacheKey, results);
        return results;
    }

    /**
     * Get all storage boxes
     * @param {Object} [filters] - Filter options
     * @returns {Array} - List of boxes
     */
    getBoxes(filters = {}) {
        let boxes = Array.from(this.storageBoxes.values());

        if (filters.hasError) {
            boxes = boxes.filter(b => b.errorCount > 0);
        }

        if (filters.minItems) {
            boxes = boxes.filter(b => b.totalItems >= filters.minItems);
        }

        if (filters.maxItems) {
            boxes = boxes.filter(b => b.totalItems <= filters.maxItems);
        }

        return boxes;
    }

    /**
     * Update storage monitor
     * @param {string} name - Monitor name
     * @param {string} entityId - Entity ID
     * @param {Array} items - Items to monitor
     * @returns {Promise<void>}
     */
    async updateStorageMonitor(name, entityId, items) {
        try {
            if (!this.rustPlus) {
                return;
            }

            const box = this.storageBoxes.get(entityId);
            if (!box) {
                await this.addBox(entityId, name);
            }

            await this.updateBoxContents(entityId);
            logger.debug('Storage monitor updated', { name, entityId, itemCount: items.length });
        } catch (error) {
            logger.error('Error updating storage monitor:', error);
            throw error;
        }
    }

    /**
     * Search box by name and item
     * @param {string} boxName - Box name
     * @param {string} itemName - Item name
     * @returns {Array} - Search results
     */
    async searchBox(boxName, itemName) {
        try {
            const searchTerm = itemName.toLowerCase();
            const boxNameTerm = boxName.toLowerCase();
            const results = [];

            for (const [boxId, box] of this.storageBoxes) {
                if (!box.name.toLowerCase().includes(boxNameTerm)) {
                    continue;
                }

                for (const item of box.items) {
                    if (item.name.toLowerCase().includes(searchTerm)) {
                        results.push({
                            boxId,
                            boxName: box.name,
                            item: item.name,
                            quantity: item.quantity,
                            lastUpdated: box.lastUpdated
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            logger.error('Error searching box:', error);
            throw error;
        }
    }

    /**
     * Search all boxes for item
     * @param {string} itemName - Item name
     * @returns {Array} - Search results
     */
    async searchAllBoxes(itemName) {
        try {
            const searchTerm = itemName.toLowerCase();
            const results = [];

            for (const [boxId, box] of this.storageBoxes) {
                for (const item of box.items) {
                    if (item.name.toLowerCase().includes(searchTerm)) {
                        results.push({
                            boxId,
                            boxName: box.name,
                            item: item.name,
                            quantity: item.quantity,
                            lastUpdated: box.lastUpdated
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            logger.error('Error searching all boxes:', error);
            throw error;
        }
    }

    /**
     * Setup storage monitoring
     * @param {Object} io - Socket.IO instance
     */
    setupStorage(io) {
        io.on('connection', (socket) => {
            socket.on('updateStorage', async (data) => {
                try {
                    await this.updateStorageMonitor(data.name, data.entityId, data.items);
                    socket.emit('storageUpdated', { success: true });
                } catch (error) {
                    socket.emit('storageUpdated', { success: false, error: error.message });
                }
            });

            socket.on('searchStorage', async (data) => {
                try {
                    const results = await this.searchItems(data.itemName, data.filters);
                    socket.emit('searchResults', results);
                } catch (error) {
                    socket.emit('searchResults', { error: error.message });
                }
            });
        });
    }

    /**
     * Initialize storage manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            await this.loadStorage();
            this.startAutoSave();
            this.startBackup();
            this.isInitialized = true;
            logger.info('Storage manager initialized');
        } catch (error) {
            logger.error('Failed to initialize storage manager:', error);
            throw error;
        }
    }

    /**
     * Cleanup storage manager
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            this.stopAutoSave();
            this.stopBackup();
            this.clearCache();

            if (this.rustPlus) {
                await this.rustPlus.disconnect();
                this.rustPlus = null;
            }

            await this.saveStorage();
            this.isInitialized = false;
            logger.info('Storage manager cleaned up');
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const storageManager = new StorageManager();
export default Object.freeze(storageManager); 