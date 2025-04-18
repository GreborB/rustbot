import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

// Configuration
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000;

// State management
let rustClient = null;
let connectionStatus = 'disconnected';
let connectionError = null;
let pendingPairing = null;
let reconnectAttempts = 0;

// Command statistics service
const commandStats = new Map();

const updateCommandStats = (command) => {
    const stats = commandStats.get(command) || { uses: 0, lastUsed: null };
    stats.uses++;
    stats.lastUsed = new Date().toISOString();
    commandStats.set(command, stats);
};

// Rust client management
const cleanupRustClient = async () => {
    if (rustClient) {
        try {
            await rustClient.disconnect();
            console.log('✅ Rust client cleaned up successfully');
        } catch (error) {
            console.error('❌ Error during Rust client cleanup:', error);
        }
        rustClient = null;
    }
    connectionStatus = 'disconnected';
    connectionError = null;
    pendingPairing = null;
    reconnectAttempts = 0;
};

const initializeRustClient = async (socket, serverInfo) => {
    try {
        await cleanupRustClient();
        
        rustClient = new RustPlus(serverInfo.ip, serverInfo.port, serverInfo.playerId, serverInfo.playerToken);
        
        rustClient.on('connected', () => {
            console.log('✅ Connected to Rust server');
            connectionStatus = 'connected';
            connectionError = null;
            reconnectAttempts = 0;
            socket.emit('connectionStatus', { status: 'connected' });
        });

        rustClient.on('disconnected', () => {
            console.log('❌ Disconnected from Rust server');
            connectionStatus = 'disconnected';
            socket.emit('connectionStatus', { status: 'disconnected' });
            attemptReconnect(socket);
        });

        rustClient.on('error', (error) => {
            console.error('❌ Rust client error:', error);
            connectionError = error.message;
            socket.emit('connectionStatus', { status: 'error', error: error.message });
        });

        await rustClient.connect();
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Rust client:', error);
        connectionError = error.message;
        socket.emit('connectionStatus', { status: 'error', error: error.message });
        return false;
    }
};

// Socket event handlers
const handlePairing = async (socket, data) => {
    try {
        pendingPairing = data;
        const success = await initializeRustClient(socket, data);
        if (success) {
            socket.emit('pairingSuccess', { message: 'Successfully paired with server' });
        } else {
            socket.emit('pairingError', { error: connectionError });
        }
    } catch (error) {
        console.error('❌ Pairing error:', error);
        socket.emit('pairingError', { error: error.message });
    }
};

const handleCommand = async (socket, data) => {
    if (!rustClient || connectionStatus !== 'connected') {
        socket.emit('commandError', { error: 'Not connected to server' });
        return;
    }

    try {
        updateCommandStats(data.command);
        // Handle specific commands here
        socket.emit('commandSuccess', { message: 'Command executed successfully' });
    } catch (error) {
        console.error('❌ Command error:', error);
        socket.emit('commandError', { error: error.message });
    }
};

// Socket setup
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('👤 New client connected');

        socket.on('pair', (data) => handlePairing(socket, data));
        socket.on('command', (data) => handleCommand(socket, data));
        socket.on('disconnect', () => {
            console.log('👤 Client disconnected');
            if (socket.id === pendingPairing?.socketId) {
                cleanupRustClient();
            }
        });
    });
} 