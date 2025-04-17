const fs = require('fs');
const path = require('path');
const config = require('./config');
const { RustPlus } = require('@liamcottle/rustplus.js');

let vendingMachines = new Map();
let rustPlus = null;

// Initialize vending machines from file if it exists
function loadVending() {
    try {
        const data = fs.readFileSync(path.join(path.dirname(config.storage.path), 'vending.json'), 'utf8');
        vendingMachines = new Map(JSON.parse(data));
    } catch (error) {
        console.log('No existing vending data found, starting fresh');
    }
}

// Save vending machines to file
function saveVending() {
    try {
        const data = JSON.stringify([...vendingMachines]);
        fs.writeFileSync(path.join(path.dirname(config.storage.path), 'vending.json'), data);
    } catch (error) {
        console.error('Error saving vending data:', error);
    }
}

// Initialize Rust+ connection
function initializeRustPlus(ip, port, playerId, playerToken) {
    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    return rustPlus.connect();
}

// Add a new vending machine
function addMachine(machineId, name) {
    if (!vendingMachines.has(machineId)) {
        vendingMachines.set(machineId, {
            id: machineId,
            name,
            items: new Map(),
            lastUpdated: Date.now()
        });
        saveVending();
    }
}

// Remove a vending machine
function removeMachine(machineId) {
    if (vendingMachines.delete(machineId)) {
        saveVending();
    }
}

// Update machine contents
async function updateMachineContents(machineId) {
    if (!rustPlus || !vendingMachines.has(machineId)) return;

    try {
        const machine = vendingMachines.get(machineId);
        const contents = await rustPlus.getEntityInfo(machineId);
        
        if (contents && contents.shopItems) {
            machine.items = new Map(contents.shopItems.map(item => [
                item.name,
                {
                    quantity: item.quantity,
                    price: item.price,
                    currency: item.currency
                }
            ]));
            machine.lastUpdated = Date.now();
            saveVending();
        }
    } catch (error) {
        console.error(`Error updating machine ${machineId}:`, error);
    }
}

// Search for items across all machines
function searchItems(itemName) {
    const results = [];
    const searchTerm = itemName.toLowerCase();

    for (const [machineId, machine] of vendingMachines) {
        for (const [item, details] of machine.items) {
            if (item.toLowerCase().includes(searchTerm)) {
                results.push({
                    machineId,
                    machineName: machine.name,
                    item,
                    quantity: details.quantity,
                    price: details.price,
                    currency: details.currency,
                    lastUpdated: machine.lastUpdated
                });
            }
        }
    }

    return results;
}

// Get all vending machines
function getMachines() {
    return Array.from(vendingMachines.values()).map(machine => ({
        ...machine,
        items: [...machine.items.entries()]
    }));
}

// Initialize vending on module load
loadVending();

module.exports = {
    addMachine,
    removeMachine,
    updateMachineContents,
    searchItems,
    getMachines,
    initializeRustPlus
}; 