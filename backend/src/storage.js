import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { RustPlus } from '@liamcottle/rustplus.js';

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

let storageBoxes = new Map();
let rustPlus = null;

// Initialize storage from file if it exists
function loadStorage() {
    try {
        const data = fs.readFileSync(config.storage.path, 'utf8');
        storageBoxes = new Map(JSON.parse(data));
    } catch (error) {
        console.log('No existing storage data found, starting fresh');
    }
}

// Save storage to file
function saveStorage() {
    try {
        const data = JSON.stringify([...storageBoxes]);
        fs.writeFileSync(config.storage.path, data);
    } catch (error) {
        console.error('Error saving storage data:', error);
    }
}

// Initialize Rust+ connection
function initializeRustPlus(ip, port, playerId, playerToken) {
    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    return rustPlus.connect();
}

// Add a new storage box
function addBox(boxId, name) {
    if (!storageBoxes.has(boxId)) {
        storageBoxes.set(boxId, {
            id: boxId,
            name: name,
            items: new Map(),
            lastUpdated: Date.now()
        });
        saveStorage();
    }
}

// Remove a storage box
function removeBox(boxId) {
    if (storageBoxes.delete(boxId)) {
        saveStorage();
    }
}

// Update box contents
async function updateBoxContents(boxId) {
    if (!rustPlus || !storageBoxes.has(boxId)) return;

    try {
        const box = storageBoxes.get(boxId);
        const contents = await rustPlus.getEntityInfo(boxId);
        
        if (contents && contents.items) {
            box.items = new Map(contents.items.map(item => [item.name, item.quantity]));
            box.lastUpdated = Date.now();
            saveStorage();
        }
    } catch (error) {
        console.error(`Error updating box ${boxId}:`, error);
    }
}

// Search for items across all boxes
function searchItems(itemName) {
    const results = [];
    const searchTerm = itemName.toLowerCase();

    for (const [boxId, box] of storageBoxes) {
        for (const [item, quantity] of box.items) {
            if (item.toLowerCase().includes(searchTerm)) {
                results.push({
                    boxId,
                    boxName: box.name,
                    item,
                    quantity,
                    lastUpdated: box.lastUpdated
                });
            }
        }
    }

    return results;
}

// Get all storage boxes
function getBoxes() {
    return Array.from(storageBoxes.values()).map(box => ({
        ...box,
        items: [...box.items.entries()]
    }));
}

// Initialize storage on module load
loadStorage();

async function updateStorageMonitor(name, entityId, items) {
  try {
    await StorageMonitor.findOneAndUpdate(
      { name },
      {
        entityId,
        items: items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          name: item.name
        })),
        lastUpdated: new Date()
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating storage monitor:', error);
    throw error;
  }
}

async function searchBox(boxName, itemName) {
  try {
    const box = await StorageMonitor.findOne({ name: boxName });
    if (!box) {
      return `Box "${boxName}" not found`;
    }

    const item = box.items.find(i => 
      i.name.toLowerCase().includes(itemName.toLowerCase())
    );

    if (!item) {
      return `Item "${itemName}" not found in box "${boxName}"`;
    }

    return `Box "${boxName}" contains ${item.quantity} ${item.name}`;
  } catch (error) {
    console.error('Error searching box:', error);
    return 'Error searching box';
  }
}

async function searchAllBoxes(itemName) {
  try {
    const boxes = await StorageMonitor.find({
      'items.name': { $regex: itemName, $options: 'i' }
    });

    if (boxes.length === 0) {
      return `No boxes found containing "${itemName}"`;
    }

    const results = boxes.map(box => {
      const item = box.items.find(i => 
        i.name.toLowerCase().includes(itemName.toLowerCase())
      );
      return `${box.name}: ${item.quantity} ${item.name}`;
    });

    return results.join('\n');
  } catch (error) {
    console.error('Error searching all boxes:', error);
    return 'Error searching boxes';
  }
}

function setupStorage(io) {
  io.on('connection', (socket) => {
    socket.on('updateStorage', async (data) => {
      try {
        await updateStorageMonitor(data.name, data.entityId, data.items);
        socket.emit('storageUpdated', { success: true });
      } catch (error) {
        socket.emit('storageError', { message: error.message });
      }
    });

    socket.on('getStorage', async (boxName) => {
      try {
        const box = await StorageMonitor.findOne({ name: boxName });
        socket.emit('storageData', box);
      } catch (error) {
        socket.emit('storageError', { message: error.message });
      }
    });
  });
}

export default {
  setupStorage,
  searchBox,
  searchAllBoxes,
  updateStorageMonitor,
  addBox,
  removeBox,
  updateBoxContents,
  searchItems,
  getBoxes,
  initializeRustPlus
}; 