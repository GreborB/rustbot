import fs from 'fs';
import path from 'path';
import config from './config.js';
import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

let activeTimers = new Map();
let rustPlus = null;

// Initialize timers from file if it exists
function loadTimers() {
    try {
        const data = fs.readFileSync(path.join(path.dirname(config.storage.path), 'timers.json'), 'utf8');
        const timers = JSON.parse(data);
        for (const timer of timers) {
            timer.endTime = new Date(timer.endTime);
            activeTimers.set(timer.id, timer);
        }
    } catch (error) {
        console.log('No existing timer data found, starting fresh');
    }
}

// Save timers to file
function saveTimers() {
    try {
        const data = JSON.stringify(Array.from(activeTimers.values()));
        fs.writeFileSync(path.join(path.dirname(config.storage.path), 'timers.json'), data);
    } catch (error) {
        console.error('Error saving timer data:', error);
    }
}

// Initialize Rust+ connection
function initializeRustPlus(ip, port, playerId, playerToken) {
    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    return rustPlus.connect();
}

// Add a new timer
function addTimer(name, duration, message, repeat = false) {
    const id = Date.now().toString();
    const endTime = new Date(Date.now() + duration * 1000);
    
    activeTimers.set(id, {
        id,
        name,
        duration,
        endTime,
        message,
        repeat,
        isActive: true
    });
    
    saveTimers();
    return id;
}

// Remove a timer
function removeTimer(timerId) {
    if (activeTimers.delete(timerId)) {
        saveTimers();
    }
}

// Check and update timers
async function checkTimers() {
    if (!rustPlus) return;

    const now = new Date();
    const completedTimers = [];

    for (const [id, timer] of activeTimers) {
        if (timer.isActive && now >= timer.endTime) {
            try {
                // Send message through Rust+ API
                await rustPlus.sendTeamMessage(timer.message);
                
                if (timer.repeat) {
                    // Reset timer for next cycle
                    timer.endTime = new Date(Date.now() + timer.duration * 1000);
                } else {
                    timer.isActive = false;
                    completedTimers.push(id);
                }
            } catch (error) {
                console.error(`Error sending timer message for ${timer.name}:`, error);
            }
        }
    }

    // Remove completed non-repeating timers
    for (const id of completedTimers) {
        activeTimers.delete(id);
    }

    if (completedTimers.length > 0) {
        saveTimers();
    }
}

// Get all active timers
function getTimers() {
    return Array.from(activeTimers.values());
}

// Start timer checking loop
function startTimerLoop() {
    setInterval(checkTimers, 1000);
}

// Initialize timers on module load
loadTimers();
startTimerLoop();

export default {
    addTimer,
    removeTimer,
    getTimers,
    initializeRustPlus
}; 