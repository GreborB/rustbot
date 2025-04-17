import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

let rustClient = null;
let connectionStatus = 'disconnected';
let connectionError = null;
let pendingPairing = null;

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
    pendingPairing = null;
};

export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Client connected');

        // Send initial connection status
        socket.emit('connectionStatus', {
            status: connectionStatus,
            error: connectionError
        });

        // Handle automatic pairing
        socket.on('startPairing', async () => {
            try {
                await cleanupRustClient();
                rustClient = new RustPlus();
                connectionStatus = 'waiting_for_pairing';
                socket.emit('connectionStatus', { status: connectionStatus });

                // Listen for pairing events
                rustClient.on('pairingRequest', async (request) => {
                    try {
                        console.log('Received pairing request:', request);
                        await rustClient.acceptPairing(request);
                        connectionStatus = 'connected';
                        socket.emit('connectionStatus', { status: connectionStatus });
                        socket.emit('rustConnected');
                    } catch (error) {
                        console.error('Pairing acceptance error:', error);
                        connectionStatus = 'error';
                        connectionError = error.message;
                        socket.emit('connectionStatus', { 
                            status: connectionStatus,
                            error: connectionError
                        });
                    }
                });

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

                // Start listening for pairing requests
                await rustClient.startPairing();
                socket.emit('pairingStarted');
            } catch (error) {
                console.error('Pairing start error:', error);
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