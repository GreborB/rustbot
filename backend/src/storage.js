import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { RustPlus } from '@liamcottle/rustplus.js';
import { logger } from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Constants
const STORAGE_FILE = 'storage.json';
const STORAGE_PATH = path.join(__dirname, '../../data', STORAGE_FILE);
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Mongoose Schema
const StorageMonitorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    entityId: { type: Number, required: true },
    items: [{
        itemId: { type: Number, required: true },
        quantity: { type: Number, required: true },
        name: { type: String, required: true }
    }],
    lastUpdated: { type: Date, default: Date.now }
});

const StorageMonitor = mongoose.model('StorageMonitor', StorageMonitorSchema);

// State management
let storageBoxes = new Map();
let rustPlus = null;
let saveInterval = null;

/**
 * Load storage data from file
 * @returns {Promise<void>}
 */
async function loadStorage() {
    try {
        if (!fs.existsSync(STORAGE_PATH)) {
            logger.info('No existing storage data found, starting fresh');
            return;
        }

        const data = await fs.promises.readFile(STORAGE_PATH, 'utf8');
        storageBoxes = new Map(JSON.parse(data));
        logger.info('Storage data loaded', { count: storageBoxes.size });
    } catch (error) {
        logger.error('Error loading storage data:', error);
        throw new Error('Failed to load storage data');
    }
}

/**
 * Save storage data to file
 * @returns {Promise<void>}
 */
async function saveStorage() {
    try {
        const data = JSON.stringify([...storageBoxes], null, 2);
        await fs.promises.writeFile(STORAGE_PATH, data);
        logger.debug('Storage data saved', { count: storageBoxes.size });
    } catch (error) {
        logger.error('Error saving storage data:', error);
        throw new Error('Failed to save storage data');
    }
}

/**
 * Start auto-saving storage data
 */
function startAutoSave() {
    if (saveInterval) {
        clearInterval(saveInterval);
    }

    saveInterval = setInterval(async () => {
        try {
            await saveStorage();
        } catch (error) {
            logger.error('Auto-save failed:', error);
        }
    }, SAVE_INTERVAL);

    logger.info('Auto-save started', { interval: SAVE_INTERVAL });
}

/**
 * Stop auto-saving storage data
 */
function stopAutoSave() {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
        logger.info('Auto-save stopped');
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

/**
 * Add a new storage box
 * @param {string} boxId - Box ID
 * @param {string} name - Box name
 * @returns {Promise<void>}
 */
async function addBox(boxId, name) {
    try {
        if (!storageBoxes.has(boxId)) {
            storageBoxes.set(boxId, {
                name,
                items: [],
                lastUpdated: new Date().toISOString()
            });
            await saveStorage();
            logger.info('Storage box added', { boxId, name });
        }
    } catch (error) {
        logger.error('Error adding storage box:', error);
        throw new Error('Failed to add storage box');
    }
}

/**
 * Remove a storage box
 * @param {string} boxId - Box ID
 * @returns {Promise<void>}
 */
async function removeBox(boxId) {
    try {
        if (storageBoxes.has(boxId)) {
            storageBoxes.delete(boxId);
            await saveStorage();
            logger.info('Storage box removed', { boxId });
        }
    } catch (error) {
        logger.error('Error removing storage box:', error);
        throw new Error('Failed to remove storage box');
    }
}

/**
 * Update box contents
 * @param {string} boxId - Box ID
 * @returns {Promise<void>}
 */
async function updateBoxContents(boxId) {
    try {
        const box = storageBoxes.get(boxId);
        if (!box) {
            throw new Error('Box not found');
        }

        if (!rustPlus) {
            throw new Error('Rust+ connection not initialized');
        }

        const response = await rustPlus.getEntityInfo(boxId);
        if (!response || !response.entityInfo) {
            throw new Error('Failed to get entity info');
        }

        box.items = response.entityInfo.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            name: item.name
        }));
        box.lastUpdated = new Date().toISOString();

        await saveStorage();
        logger.debug('Box contents updated', { boxId });
    } catch (error) {
        logger.error('Error updating box contents:', error);
        throw new Error('Failed to update box contents');
    }
}

/**
 * Search for items in all boxes
 * @param {string} itemName - Item name to search for
 * @returns {Array} - List of matching items
 */
function searchItems(itemName) {
    try {
        const results = [];
        const searchTerm = itemName.toLowerCase();

        for (const [boxId, box] of storageBoxes) {
            const matchingItems = box.items.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );

            if (matchingItems.length > 0) {
                results.push({
                    boxId,
                    boxName: box.name,
                    items: matchingItems
                });
            }
        }

        logger.debug('Items searched', { itemName, results: results.length });
        return results;
    } catch (error) {
        logger.error('Error searching items:', error);
        throw new Error('Failed to search items');
    }
}

/**
 * Get all storage boxes
 * @returns {Array} - List of storage boxes
 */
function getBoxes() {
    return Array.from(storageBoxes.entries()).map(([boxId, box]) => ({
        boxId,
        ...box
    }));
}

/**
 * Update storage monitor in database
 * @param {string} name - Monitor name
 * @param {number} entityId - Entity ID
 * @param {Array} items - List of items
 * @returns {Promise<void>}
 */
async function updateStorageMonitor(name, entityId, items) {
    try {
        const monitor = await StorageMonitor.findOneAndUpdate(
            { name },
            {
                entityId,
                items,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        logger.debug('Storage monitor updated', { name, entityId });
        return monitor;
    } catch (error) {
        logger.error('Error updating storage monitor:', error);
        throw new Error('Failed to update storage monitor');
    }
}

/**
 * Search for items in a specific box
 * @param {string} boxName - Box name
 * @param {string} itemName - Item name
 * @returns {Promise<Array>} - List of matching items
 */
async function searchBox(boxName, itemName) {
    try {
        const box = Array.from(storageBoxes.values()).find(b => b.name === boxName);
        if (!box) {
            throw new Error('Box not found');
        }

        const searchTerm = itemName.toLowerCase();
        const matchingItems = box.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );

        logger.debug('Box searched', { boxName, itemName, results: matchingItems.length });
        return matchingItems;
    } catch (error) {
        logger.error('Error searching box:', error);
        throw new Error('Failed to search box');
    }
}

/**
 * Search for items in all boxes
 * @param {string} itemName - Item name
 * @returns {Promise<Array>} - List of matching items
 */
async function searchAllBoxes(itemName) {
    try {
        const results = [];
        const searchTerm = itemName.toLowerCase();

        for (const [boxId, box] of storageBoxes) {
            const matchingItems = box.items.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );

            if (matchingItems.length > 0) {
                results.push({
                    boxId,
                    boxName: box.name,
                    items: matchingItems
                });
            }
        }

        logger.debug('All boxes searched', { itemName, results: results.length });
        return results;
    } catch (error) {
        logger.error('Error searching all boxes:', error);
        throw new Error('Failed to search all boxes');
    }
}

/**
 * Setup storage socket handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupStorage(io) {
    io.on('connection', (socket) => {
        logger.info('Client connected to storage', { socketId: socket.id });

        socket.on('getBoxes', () => {
            try {
                const boxes = getBoxes();
                socket.emit('boxes', boxes);
            } catch (error) {
                logger.error('Error getting boxes:', error);
                socket.emit('error', 'Failed to get boxes');
            }
        });

        socket.on('searchItems', (itemName) => {
            try {
                const results = searchItems(itemName);
                socket.emit('searchResults', results);
            } catch (error) {
                logger.error('Error searching items:', error);
                socket.emit('error', 'Failed to search items');
            }
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected from storage', { socketId: socket.id });
        });
    });
}

/**
 * Initialize storage module
 * @returns {Promise<void>}
 */
async function initialize() {
    try {
        await loadStorage();
        startAutoSave();
        logger.info('Storage module initialized');
    } catch (error) {
        logger.error('Failed to initialize storage module:', error);
        throw error;
    }
}

/**
 * Cleanup storage module
 * @returns {Promise<void>}
 */
async function cleanup() {
    try {
        stopAutoSave();
        await saveStorage();
        logger.info('Storage module cleaned up');
    } catch (error) {
        logger.error('Error during cleanup:', error);
        throw error;
    }
}

export {
    initialize,
    cleanup,
    initializeRustPlus,
    addBox,
    removeBox,
    updateBoxContents,
    searchItems,
    getBoxes,
    updateStorageMonitor,
    searchBox,
    searchAllBoxes,
    setupStorage
}; 