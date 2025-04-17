const fs = require('fs');
const path = require('path');
const config = require('./config');
const { RustPlus } = require('@liamcottle/rustplus.js');

let smartSwitches = new Map();
let rustPlus = null;

// Initialize switches from file if it exists
function loadSwitches() {
    try {
        const data = fs.readFileSync(path.join(path.dirname(config.storage.path), 'switches.json'), 'utf8');
        smartSwitches = new Map(JSON.parse(data));
    } catch (error) {
        console.log('No existing switch data found, starting fresh');
    }
}

// Save switches to file
function saveSwitches() {
    try {
        const data = JSON.stringify([...smartSwitches]);
        fs.writeFileSync(path.join(path.dirname(config.storage.path), 'switches.json'), data);
    } catch (error) {
        console.error('Error saving switch data:', error);
    }
}

// Initialize Rust+ connection
function initializeRustPlus(ip, port, playerId, playerToken) {
    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    return rustPlus.connect();
}

// Add a new smart switch
function addSwitch(switchId, name) {
    if (!smartSwitches.has(switchId)) {
        smartSwitches.set(switchId, {
            id: switchId,
            name,
            isOn: false,
            lastUpdated: Date.now()
        });
        saveSwitches();
    }
}

// Remove a smart switch
function removeSwitch(switchId) {
    if (smartSwitches.delete(switchId)) {
        saveSwitches();
    }
}

// Toggle switch state
async function toggleSwitch(switchId, state) {
    if (!rustPlus || !smartSwitches.has(switchId)) return;

    try {
        const switchObj = smartSwitches.get(switchId);
        await rustPlus.setEntityValue(switchId, state);
        
        switchObj.isOn = state;
        switchObj.lastUpdated = Date.now();
        saveSwitches();
    } catch (error) {
        console.error(`Error toggling switch ${switchId}:`, error);
    }
}

// Update switch state from server
async function updateSwitchState(switchId) {
    if (!rustPlus || !smartSwitches.has(switchId)) return;

    try {
        const switchObj = smartSwitches.get(switchId);
        const state = await rustPlus.getEntityValue(switchId);
        
        if (state !== undefined) {
            switchObj.isOn = state;
            switchObj.lastUpdated = Date.now();
            saveSwitches();
        }
    } catch (error) {
        console.error(`Error updating switch ${switchId}:`, error);
    }
}

// Update all switch states
async function updateAllSwitches() {
    if (!rustPlus) return;

    for (const [switchId] of smartSwitches) {
        await updateSwitchState(switchId);
    }
}

// Get all smart switches
function getSwitches() {
    return Array.from(smartSwitches.values());
}

// Initialize switches on module load
loadSwitches();

module.exports = {
    addSwitch,
    removeSwitch,
    toggleSwitch,
    updateSwitchState,
    updateAllSwitches,
    getSwitches,
    initializeRustPlus
}; 