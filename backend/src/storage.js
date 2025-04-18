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
        throw error;
    }
}

/**
 * Save storage data to file
 * @returns {Promise<void>}
 */
async function saveStorage() {
    try {
        const data = JSON.stringify(Array.from(storageBoxes.entries()));
        await fs.promises.writeFile(STORAGE_PATH, data, 'utf8');
        logger.info('Storage data saved', { count: storageBoxes.size });
    } catch (error) {
        logger.error('Error saving storage data:', error);
        throw error;
    }
}

/**
 * Start auto-save interval
 */
function startAutoSave() {
    if (saveInterval) {
        clearInterval(saveInterval);
    }
    saveInterval = setInterval(async () => {
        try {
            await saveStorage();
        } catch (error) {
            logger.error('Error in auto-save:', error);
        }
    }, SAVE_INTERVAL);
    logger.info('Auto-save started', { interval: SAVE_INTERVAL });
}

/**
 * Stop auto-save interval
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
        if (rustPlus) {
            await rustPlus.disconnect();
        }

        rustPlus = new RustPlus(ip, port, playerId, playerToken);
        await rustPlus.connect();
        logger.info('Rust+ connection initialized');
    } catch (error) {
        logger.error('Error initializing Rust+ connection:', error);
        throw error;
    }
}

/**
 * Add a storage box
 * @param {number} boxId - Box ID
 * @param {string} name - Box name
 * @returns {Promise<void>}
 */
async function addBox(boxId, name) {
    try {
        if (storageBoxes.has(boxId)) {
            throw new Error(`Box with ID ${boxId} already exists`);
        }

        storageBoxes.set(boxId, {
            name,
            items: [],
            lastUpdated: new Date()
        });

        await saveStorage();
        logger.info('Box added', { boxId, name });
    } catch (error) {
        logger.error('Error adding box:', error);
        throw error;
    }
}

/**
 * Remove a storage box
 * @param {number} boxId - Box ID
 * @returns {Promise<void>}
 */
async function removeBox(boxId) {
    try {
        if (!storageBoxes.has(boxId)) {
            throw new Error(`Box with ID ${boxId} not found`);
        }

        storageBoxes.delete(boxId);
        await saveStorage();
        logger.info('Box removed', { boxId });
    } catch (error) {
        logger.error('Error removing box:', error);
        throw error;
    }
}

/**
 * Update box contents
 * @param {number} boxId - Box ID
 * @returns {Promise<void>}
 */
async function updateBoxContents(boxId) {
    try {
        if (!rustPlus) {
            throw new Error('Rust+ connection not initialized');
        }

        if (!storageBoxes.has(boxId)) {
            throw new Error(`Box with ID ${boxId} not found`);
        }

        const box = storageBoxes.get(boxId);
        const response = await rustPlus.getEntityInfo(boxId);

        if (!response || !response.entityInfo) {
            throw new Error(`Failed to get entity info for box ${boxId}`);
        }

        const items = response.entityInfo.payload.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            name: item.name
        }));

        box.items = items;
        box.lastUpdated = new Date();
        storageBoxes.set(boxId, box);

        await saveStorage();
        logger.info('Box contents updated', { boxId, itemCount: items.length });
    } catch (error) {
        logger.error('Error updating box contents:', error);
        throw error;
    }
}

/**
 * Search for items by name
 * @param {string} itemName - Item name to search for
 * @returns {Array} List of matching items
 */
function searchItems(itemName) {
    const results = [];
    const searchTerm = itemName.toLowerCase();

    for (const [boxId, box] of storageBoxes.entries()) {
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

    return results;
}

/**
 * Get all storage boxes
 * @returns {Array} List of storage boxes
 */
function getBoxes() {
    return Array.from(storageBoxes.entries()).map(([boxId, box]) => ({
        boxId,
        name: box.name,
        itemCount: box.items.length,
        lastUpdated: box.lastUpdated
    }));
}

/**
 * Update storage monitor
 * @param {string} name - Monitor name
 * @param {number} entityId - Entity ID
 * @param {Array} items - List of items
 * @returns {Promise<void>}
 */
async function updateStorageMonitor(name, entityId, items) {
    try {
        const box = storageBoxes.get(entityId) || {
            name,
            items: [],
            lastUpdated: new Date()
        };

        box.items = items;
        box.lastUpdated = new Date();
        storageBoxes.set(entityId, box);

        await saveStorage();
        logger.info('Storage monitor updated', { name, entityId, itemCount: items.length });
    } catch (error) {
        logger.error('Error updating storage monitor:', error);
        throw error;
    }
}

/**
 * Search for items in a specific box
 * @param {string} boxName - Box name
 * @param {string} itemName - Item name
 * @returns {Array} List of matching items
 */
async function searchBox(boxName, itemName) {
    try {
        const box = Array.from(storageBoxes.values()).find(b => 
            b.name.toLowerCase() === boxName.toLowerCase()
        );

        if (!box) {
            throw new Error(`Box with name ${boxName} not found`);
        }

        const searchTerm = itemName.toLowerCase();
        return box.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    } catch (error) {
        logger.error('Error searching box:', error);
        throw error;
    }
}

/**
 * Search for items in all boxes
 * @param {string} itemName - Item name
 * @returns {Array} List of matching items
 */
async function searchAllBoxes(itemName) {
    try {
        const results = [];
        const searchTerm = itemName.toLowerCase();

        for (const [boxId, box] of storageBoxes.entries()) {
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

        return results;
    } catch (error) {
        logger.error('Error searching all boxes:', error);
        throw error;
    }
}

/**
 * Set up storage socket handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function setupStorage(io) {
    io.on('connection', (socket) => {
        logger.info('New storage socket connection');

        socket.on('addBox', async (data) => {
            try {
                await addBox(data.boxId, data.name);
                socket.emit('boxAdded', { boxId: data.boxId, name: data.name });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('removeBox', async (data) => {
            try {
                await removeBox(data.boxId);
                socket.emit('boxRemoved', { boxId: data.boxId });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('updateBox', async (data) => {
            try {
                await updateBoxContents(data.boxId);
                const box = storageBoxes.get(data.boxId);
                socket.emit('boxUpdated', { boxId: data.boxId, box });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('searchItems', (data) => {
            try {
                const results = searchItems(data.itemName);
                socket.emit('searchResults', results);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('getBoxes', () => {
            try {
                const boxes = getBoxes();
                socket.emit('boxesList', boxes);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
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
        logger.error('Error initializing storage module:', error);
        throw error;
    }
}

/**
 * Clean up storage module
 * @returns {Promise<void>}
 */
async function cleanup() {
    try {
        stopAutoSave();
        await saveStorage();
        if (rustPlus) {
            await rustPlus.disconnect();
        }
        logger.info('Storage module cleaned up');
    } catch (error) {
        logger.error('Error cleaning up storage module:', error);
        throw error;
    }
}

export {
    initialize,
    cleanup,
    setupStorage,
    initializeRustPlus,
    addBox,
    removeBox,
    updateBoxContents,
    searchItems,
    getBoxes,
    updateStorageMonitor,
    searchBox,
    searchAllBoxes
}; 