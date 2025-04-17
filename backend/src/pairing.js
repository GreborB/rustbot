const { RustPlus } = require('@liamcottle/rustplus.js');
const config = require('./config');

let rustPlus = null;
let pairingInfo = null;

// Initialize Rust+ connection
async function initializeRustPlus(ip, port, playerId, playerToken) {
    if (rustPlus) {
        await rustPlus.disconnect();
    }

    rustPlus = new RustPlus(ip, port, playerId, playerToken);
    
    rustPlus.on('connected', () => {
        console.log('Connected to Rust server');
    });

    rustPlus.on('disconnected', () => {
        console.log('Disconnected from Rust server');
    });

    rustPlus.on('error', (error) => {
        console.error('Rust+ error:', error);
    });

    return rustPlus.connect();
}

// Start the pairing process
async function startPairing() {
    try {
        // Generate a random 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        
        pairingInfo = {
            code,
            timestamp: Date.now(),
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes
        };

        return code;
    } catch (error) {
        console.error('Error starting pairing:', error);
        throw error;
    }
}

// Verify pairing code
function verifyPairingCode(code) {
    if (!pairingInfo) {
        return false;
    }

    if (Date.now() > pairingInfo.expires) {
        pairingInfo = null;
        return false;
    }

    return code === pairingInfo.code;
}

// Get server info
async function getServerInfo() {
    if (!rustPlus) {
        return { connected: false };
    }

    try {
        const info = await rustPlus.getServerInfo();
        return {
            connected: true,
            name: info.name,
            url: info.url,
            mapSize: info.mapSize,
            seed: info.seed,
            maxPlayers: info.maxPlayers,
            players: info.players
        };
    } catch (error) {
        console.error('Error getting server info:', error);
        return { connected: false };
    }
}

// Setup socket handlers for pairing
function setupPairingHandlers(io) {
    io.on('connection', (socket) => {
        socket.on('getServerInfo', async () => {
            try {
                const info = await getServerInfo();
                socket.emit('serverInfo', info);
            } catch (error) {
                socket.emit('serverError', { message: 'Failed to get server info' });
            }
        });

        socket.on('startPairing', async () => {
            try {
                const code = await startPairing();
                socket.emit('pairingCode', code);
            } catch (error) {
                socket.emit('pairingError', { message: 'Failed to start pairing process' });
            }
        });

        socket.on('confirmPairing', async (data) => {
            try {
                if (verifyPairingCode(data.code)) {
                    await initializeRustPlus(
                        data.serverIp,
                        data.serverPort,
                        data.playerId,
                        data.playerToken
                    );
                    socket.emit('pairingSuccess');
                } else {
                    socket.emit('pairingError', { message: 'Invalid or expired pairing code' });
                }
            } catch (error) {
                socket.emit('pairingError', { message: 'Failed to complete pairing process' });
            }
        });
    });
}

module.exports = {
    setupPairingHandlers,
    getServerInfo,
    initializeRustPlus
}; 