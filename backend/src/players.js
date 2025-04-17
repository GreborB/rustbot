import fs from 'fs';
import path from 'path';
import config from './config.js';
import { RustPlus } from '@liamcottle/rustplus.js';

let trackedPlayers = new Map();
let rustPlus = null;

// Initialize players from file if it exists
function loadPlayers() {
    try {
        const data = fs.readFileSync(path.join(path.dirname(config.storage.path), 'players.json'), 'utf8');
        trackedPlayers = new Map(JSON.parse(data));
    } catch (error) {
        console.log('No existing player data found, starting fresh');
    }
}

// Save players to file
function savePlayers() {
    try {
        const data = JSON.stringify([...trackedPlayers]);
        fs.writeFileSync(path.join(path.dirname(config.storage.path), 'players.json'), data);
    } catch (error) {
        console.error('Error saving player data:', error);
    }
}

// Initialize Rust+ connection
function initializeRustPlus(ip, port, playerId, playerToken) {
    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    return rustPlus.connect();
}

// Add a player to track
function addPlayer(steamId, name) {
    if (!trackedPlayers.has(steamId)) {
        trackedPlayers.set(steamId, {
            steamId,
            name,
            lastSeen: null,
            isOnline: false,
            lastLocation: null
        });
        savePlayers();
    }
}

// Remove a player from tracking
function removePlayer(steamId) {
    if (trackedPlayers.delete(steamId)) {
        savePlayers();
    }
}

// Update player status
async function updatePlayerStatus(steamId) {
    if (!rustPlus || !trackedPlayers.has(steamId)) return;

    try {
        const player = trackedPlayers.get(steamId);
        const info = await rustPlus.getPlayerInfo(steamId);
        
        if (info) {
            player.isOnline = info.isOnline;
            player.lastSeen = info.lastSeen;
            player.lastLocation = info.position;
            savePlayers();
        }
    } catch (error) {
        console.error(`Error updating player ${steamId}:`, error);
    }
}

// Update all tracked players
async function updateAllPlayers() {
    if (!rustPlus) return;

    for (const [steamId] of trackedPlayers) {
        await updatePlayerStatus(steamId);
    }
}

// Get all tracked players
function getPlayers() {
    return Array.from(trackedPlayers.values());
}

// Initialize players on module load
loadPlayers();

export default {
    addPlayer,
    removePlayer,
    updatePlayerStatus,
    updateAllPlayers,
    getPlayers,
    initializeRustPlus
}; 