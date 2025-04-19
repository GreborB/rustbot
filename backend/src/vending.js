/**
 * Vending machine management service
 * @module vending
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import logger from './utils/logger.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vending configuration
const VENDING_CONFIG = {
    FILE_NAME: 'vending.json',
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_MACHINES: 100,
    MAX_NAME_LENGTH: 32,
    MAX_ITEMS_PER_MACHINE: 100,
    MAX_ITEM_NAME_LENGTH: 64,
    MAX_PRICE: 1000000,
    CURRENCIES: ['scrap', 'wood', 'stone', 'metal', 'hqm'],
    SEARCH_CACHE_TTL: 5 * 60 * 1000 // 5 minutes
};

class VendingManager {
    constructor() {
        this.vendingMachines = new Map();
        this.rustPlus = null;
        this.updateInterval = null;
        this.vendingPath = path.join(__dirname, '../../data', VENDING_CONFIG.FILE_NAME);
        this.searchCache = new Map();
        this.lastSearchUpdate = 0;
    }

    /**
     * Load vending machines from file
     * @returns {Promise<void>}
     */
    async loadVending() {
        try {
            if (!fs.existsSync(this.vendingPath)) {
                logger.info('No existing vending data found, starting fresh');
                return;
            }

            const data = await fs.promises.readFile(this.vendingPath, 'utf8');
            const parsedData = JSON.parse(data);
            
            // Validate and sanitize loaded data
            const validMachines = parsedData.filter(([machineId, machine]) => {
                return this.validateMachineData(machineId, machine);
            });

            this.vendingMachines = new Map(validMachines);
            logger.info('Vending data loaded', { count: this.vendingMachines.size });
        } catch (error) {
            logger.error('Error loading vending data:', error);
            throw new Error('Failed to load vending data');
        }
    }

    /**
     * Validate machine data
     * @param {string} machineId - Machine ID
     * @param {Object} machine - Machine data
     * @returns {boolean} - Whether the data is valid
     */
    validateMachineData(machineId, machine) {
        return (
            typeof machineId === 'string' &&
            machineId.length > 0 &&
            typeof machine === 'object' &&
            machine !== null &&
            typeof machine.name === 'string' &&
            machine.name.length <= VENDING_CONFIG.MAX_NAME_LENGTH &&
            machine.items instanceof Map &&
            typeof machine.lastUpdated === 'number'
        );
    }

    /**
     * Save vending machines to file
     * @returns {Promise<void>}
     */
    async saveVending() {
        try {
            const data = JSON.stringify([...this.vendingMachines], null, 2);
            await fs.promises.writeFile(this.vendingPath, data);
            logger.debug('Vending data saved', { count: this.vendingMachines.size });
        } catch (error) {
            logger.error('Error saving vending data:', error);
            throw new Error('Failed to save vending data');
        }
    }

    /**
     * Start vending machine updates
     */
    startVendingUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(async () => {
            try {
                await this.updateAllMachines();
            } catch (error) {
                logger.error('Error in vending update loop:', error);
            }
        }, VENDING_CONFIG.UPDATE_INTERVAL);

        logger.info('Vending updates started', { interval: VENDING_CONFIG.UPDATE_INTERVAL });
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
            this.startVendingUpdates();
            logger.info('Rust+ connection initialized');
        } catch (error) {
            logger.error('Failed to initialize Rust+ connection:', error);
            throw new Error('Failed to initialize Rust+ connection');
        }
    }

    /**
     * Add a new vending machine
     * @param {string} machineId - Machine ID
     * @param {string} name - Machine name
     * @returns {Promise<void>}
     */
    async addMachine(machineId, name) {
        try {
            if (this.vendingMachines.size >= VENDING_CONFIG.MAX_MACHINES) {
                throw new Error('Maximum number of vending machines reached');
            }

            if (!machineId || !name) {
                throw new Error('Invalid machine data');
            }

            if (name.length > VENDING_CONFIG.MAX_NAME_LENGTH) {
                name = name.substring(0, VENDING_CONFIG.MAX_NAME_LENGTH);
            }

            if (!this.vendingMachines.has(machineId)) {
                this.vendingMachines.set(machineId, {
                    id: machineId,
                    name,
                    items: new Map(),
                    lastUpdated: Date.now(),
                    lastError: null,
                    errorCount: 0,
                    totalItemsSold: 0,
                    totalValueSold: 0
                });
                await this.saveVending();
                logger.info('Vending machine added', { machineId, name });
            }
        } catch (error) {
            logger.error('Error adding vending machine:', error);
            throw error;
        }
    }

    /**
     * Remove a vending machine
     * @param {string} machineId - Machine ID
     * @returns {Promise<void>}
     */
    async removeMachine(machineId) {
        try {
            if (this.vendingMachines.delete(machineId)) {
                await this.saveVending();
                logger.info('Vending machine removed', { machineId });
            }
        } catch (error) {
            logger.error('Error removing vending machine:', error);
            throw error;
        }
    }

    /**
     * Update machine contents
     * @param {string} machineId - Machine ID
     * @returns {Promise<void>}
     */
    async updateMachineContents(machineId) {
        try {
            if (!this.rustPlus || !this.vendingMachines.has(machineId)) {
                return;
            }

            const machine = this.vendingMachines.get(machineId);
            const contents = await this.rustPlus.getEntityInfo(machineId);
            
            if (contents && contents.shopItems) {
                const newItems = new Map();
                let totalItems = 0;
                let totalValue = 0;

                for (const item of contents.shopItems) {
                    if (totalItems >= VENDING_CONFIG.MAX_ITEMS_PER_MACHINE) {
                        logger.warn('Machine has too many items, truncating', { machineId });
                        break;
                    }

                    if (item.name.length > VENDING_CONFIG.MAX_ITEM_NAME_LENGTH) {
                        item.name = item.name.substring(0, VENDING_CONFIG.MAX_ITEM_NAME_LENGTH);
                    }

                    if (item.price > VENDING_CONFIG.MAX_PRICE) {
                        logger.warn('Item price exceeds maximum, truncating', { machineId, item: item.name });
                        item.price = VENDING_CONFIG.MAX_PRICE;
                    }

                    if (!VENDING_CONFIG.CURRENCIES.includes(item.currency)) {
                        logger.warn('Invalid currency, defaulting to scrap', { machineId, item: item.name });
                        item.currency = 'scrap';
                    }

                    newItems.set(item.name, {
                        quantity: item.quantity,
                        price: item.price,
                        currency: item.currency
                    });

                    totalItems++;
                    totalValue += item.price * item.quantity;
                }

                machine.items = newItems;
                machine.lastUpdated = Date.now();
                machine.errorCount = 0;
                machine.lastError = null;
                machine.totalItemsSold = totalItems;
                machine.totalValueSold = totalValue;

                await this.saveVending();
                logger.debug('Machine contents updated', { machineId, itemCount: totalItems });
            }
        } catch (error) {
            const machine = this.vendingMachines.get(machineId);
            machine.errorCount++;
            machine.lastError = error.message;
            await this.saveVending();
            logger.error(`Error updating machine ${machineId}:`, error);
            throw error;
        }
    }

    /**
     * Update all machines
     * @returns {Promise<void>}
     */
    async updateAllMachines() {
        try {
            if (!this.rustPlus) {
                return;
            }

            for (const [machineId] of this.vendingMachines) {
                try {
                    await this.updateMachineContents(machineId);
                } catch (error) {
                    logger.error(`Error updating machine ${machineId}:`, error);
                }
            }

            // Clear search cache
            this.searchCache.clear();
            this.lastSearchUpdate = Date.now();
        } catch (error) {
            logger.error('Error updating all machines:', error);
            throw error;
        }
    }

    /**
     * Search for items across all machines
     * @param {string} itemName - Item name to search for
     * @param {Object} [filters] - Search filters
     * @returns {Array} - Search results
     */
    searchItems(itemName, filters = {}) {
        const now = Date.now();
        const cacheKey = `${itemName}-${JSON.stringify(filters)}`;

        // Check cache
        if (this.searchCache.has(cacheKey) && 
            now - this.lastSearchUpdate < VENDING_CONFIG.SEARCH_CACHE_TTL) {
            return this.searchCache.get(cacheKey);
        }

        const searchTerm = itemName.toLowerCase();
        const results = [];

        for (const [machineId, machine] of this.vendingMachines) {
            // Apply machine filters
            if (filters.minItems && machine.totalItemsSold < filters.minItems) continue;
            if (filters.maxItems && machine.totalItemsSold > filters.maxItems) continue;
            if (filters.minValue && machine.totalValueSold < filters.minValue) continue;
            if (filters.maxValue && machine.totalValueSold > filters.maxValue) continue;

            for (const [item, details] of machine.items) {
                // Apply item filters
                if (filters.minPrice && details.price < filters.minPrice) continue;
                if (filters.maxPrice && details.price > filters.maxPrice) continue;
                if (filters.currency && details.currency !== filters.currency) continue;
                if (filters.minQuantity && details.quantity < filters.minQuantity) continue;

                if (item.toLowerCase().includes(searchTerm)) {
                    results.push({
                        machineId,
                        machineName: machine.name,
                        item,
                        quantity: details.quantity,
                        price: details.price,
                        currency: details.currency,
                        lastUpdated: machine.lastUpdated,
                        errorCount: machine.errorCount,
                        lastError: machine.lastError
                    });
                }
            }
        }

        // Sort results
        if (filters.sortBy) {
            results.sort((a, b) => {
                if (filters.sortBy === 'price') return a.price - b.price;
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
     * Get all vending machines
     * @param {Object} [filters] - Filter options
     * @returns {Array} - List of machines
     */
    getMachines(filters = {}) {
        let machines = Array.from(this.vendingMachines.values());

        if (filters.hasError) {
            machines = machines.filter(m => m.errorCount > 0);
        }

        if (filters.minItems) {
            machines = machines.filter(m => m.totalItemsSold >= filters.minItems);
        }

        if (filters.maxItems) {
            machines = machines.filter(m => m.totalItemsSold <= filters.maxItems);
        }

        return machines.map(machine => ({
            ...machine,
            items: [...machine.items.entries()]
        }));
    }

    /**
     * Cleanup vending manager
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

            await this.saveVending();
            logger.info('Vending manager cleaned up');
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const vendingManager = new VendingManager();
export default Object.freeze(vendingManager); 