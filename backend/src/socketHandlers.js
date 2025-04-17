import { RustPlus } from '@liamcottle/rustplus.js';
import config from './config.js';

let rustClient = null;
let connectionStatus = 'disconnected';
let connectionError = null;

const cleanupRustClient = async () => {
    if (rustClient) {
        try {
            await rustClient.disconnect();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
        rustClient = null;
    }
    connectionStatus = 'disconnected';
    connectionError = null;
};

export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Client connected');

        // Send initial connection status
        socket.emit('connectionStatus', {
            status: connectionStatus,
            error: connectionError
        });

        // Server pairing
        socket.on('pairServer', async (data) => {
            if (!data || !data.pairingCode) {
                return socket.emit('pairingError', { error: 'Invalid pairing data' });
            }

            try {
                await cleanupRustClient();

                rustClient = new RustPlus();
                connectionStatus = 'connecting';
                connectionError = null;
                socket.emit('connectionStatus', { status: connectionStatus });

                const serverInfo = await rustClient.getServerInfo(data.pairingCode);
                
                if (!serverInfo || !serverInfo.ip || !serverInfo.port || !serverInfo.playerToken) {
                    throw new Error('Invalid server info received');
                }

                await rustClient.connect(serverInfo.ip, serverInfo.port, serverInfo.playerToken);
                
                // Set up event listeners for the Rust client
                rustClient.on('connected', () => {
                    console.log('Connected to Rust server');
                    connectionStatus = 'connected';
                    connectionError = null;
                    socket.emit('connectionStatus', { status: connectionStatus });
                    socket.emit('rustConnected');
                });

                rustClient.on('disconnected', () => {
                    console.log('Disconnected from Rust server');
                    connectionStatus = 'disconnected';
                    socket.emit('connectionStatus', { status: connectionStatus });
                    socket.emit('rustDisconnected');
                });

                rustClient.on('error', (error) => {
                    console.error('Rust client error:', error);
                    connectionStatus = 'error';
                    connectionError = error.message;
                    socket.emit('connectionStatus', { 
                        status: connectionStatus,
                        error: connectionError
                    });
                    socket.emit('rustError', { error: error.message });
                });

                socket.emit('serverPaired', { 
                    success: true,
                    serverInfo: {
                        name: serverInfo.name,
                        players: serverInfo.players,
                        maxPlayers: serverInfo.maxPlayers
                    }
                });
            } catch (error) {
                console.error('Pairing error:', error);
                await cleanupRustClient();
                socket.emit('connectionStatus', { 
                    status: 'error',
                    error: error.message
                });
                socket.emit('pairingError', { error: error.message });
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log('Client disconnected');
            await cleanupRustClient();
        });

        // Core functionality
        socket.on('getStorageContents', async (data) => {
            if (!data || !data.storageId) {
                return socket.emit('storageError', { error: 'Invalid storage ID' });
            }

            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('storageError', { error: 'Not connected to server' });
            }

            try {
                const contents = await rustClient.getStorageContents(data.storageId);
                socket.emit('storageContents', contents);
            } catch (error) {
                console.error('Storage error:', error);
                socket.emit('storageError', { error: error.message });
            }
        });

        socket.on('controlSwitch', async (data) => {
            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('switchError', { error: 'Not connected to server' });
            }
            try {
                await rustClient.turnSmartSwitch(data.id, data.state);
                socket.emit('switchState', { id: data.id, state: data.state });
            } catch (error) {
                console.error('Switch error:', error);
                socket.emit('switchError', { error: error.message });
            }
        });

        socket.on('getPlayerInfo', async (data) => {
            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('playerError', { error: 'Not connected to server' });
            }
            try {
                const info = await rustClient.getPlayerInfo(data.steamId);
                socket.emit('playerInfo', info);
            } catch (error) {
                console.error('Player error:', error);
                socket.emit('playerError', { error: error.message });
            }
        });

        socket.on('addTimer', async (data) => {
            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('timerError', { error: 'Not connected to server' });
            }
            try {
                await rustClient.setTimer(data.name, data.duration, data.message, data.isRepeating);
                socket.emit('timerAdded', { success: true });
            } catch (error) {
                console.error('Timer error:', error);
                socket.emit('timerError', { error: error.message });
            }
        });

        socket.on('removeTimer', async (data) => {
            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('timerError', { error: 'Not connected to server' });
            }
            try {
                await rustClient.removeTimer(data.timerId);
                socket.emit('timerRemoved', { success: true });
            } catch (error) {
                console.error('Timer error:', error);
                socket.emit('timerError', { error: error.message });
            }
        });

        socket.on('searchVending', async (data) => {
            if (!rustClient || connectionStatus !== 'connected') {
                return socket.emit('vendingError', { error: 'Not connected to server' });
            }
            try {
                const results = await rustClient.searchVendingMachines(data.searchTerm);
                socket.emit('vendingSearchResults', results);
            } catch (error) {
                console.error('Vending error:', error);
                socket.emit('vendingError', { error: error.message });
            }
        });
    });
} 