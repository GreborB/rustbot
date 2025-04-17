import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

let rustClient = null;
let connectionStatus = 'disconnected';
let connectionError = null;
let pendingPairing = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const cleanupRustClient = async () => {
    if (rustClient) {
        try {
            console.log('Cleaning up Rust client...');
            await rustClient.disconnect();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
        rustClient = null;
    }
    connectionStatus = 'disconnected';
    connectionError = null;
    pendingPairing = null;
    reconnectAttempts = 0;
};

// Helper for consistent socket response with error handling
const safeEmit = (socket, event, data) => {
    try {
        if (socket && socket.connected) {
            socket.emit(event, data);
        }
    } catch (error) {
        console.error(`Error emitting ${event}:`, error);
    }
};

export function setupSocketHandlers(io) {
    // Middleware for authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                console.warn('Socket connection attempt without token');
                return next(new Error('Authentication error: No token provided'));
            }
            
            // In a real application, you would verify the token here
            // For now, we'll just check if it exists
            console.log(`Socket authenticated with token ${token.substring(0, 5)}...`);
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            next(new Error('Authentication error: ' + (error.message || 'Unknown error')));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        
        // Track socket disconnections for cleanup
        let hasDisconnected = false;

        // Send initial connection status
        safeEmit(socket, 'connectionStatus', {
            status: connectionStatus,
            error: connectionError
        });

        // Handle automatic pairing
        socket.on('startPairing', async () => {
            console.log('Start pairing request received');
            
            try {
                await cleanupRustClient();
                
                try {
                    console.log('Initializing Rust client for pairing...');
                    rustClient = new RustPlus();
                    connectionStatus = 'waiting_for_pairing';
                    safeEmit(socket, 'connectionStatus', { status: connectionStatus });
                    
                    // In a real app, this would use the Rust server details
                    // For now, we'll simulate a successful pairing after a delay
                    setTimeout(() => {
                        if (rustClient) {
                            connectionStatus = 'connected';
                            safeEmit(socket, 'connectionStatus', { status: connectionStatus });
                            safeEmit(socket, 'serverPaired', {
                                success: true,
                                serverInfo: {
                                    name: 'Test Rust Server',
                                    players: 42,
                                    maxPlayers: 100
                                }
                            });
                        }
                    }, 2000);
                    
                } catch (error) {
                    console.error('Error during pairing:', error);
                    connectionStatus = 'disconnected';
                    connectionError = error.message || 'Unknown error during pairing';
                    safeEmit(socket, 'pairingError', { error: connectionError });
                }
            } catch (error) {
                console.error('Error in startPairing:', error);
                safeEmit(socket, 'pairingError', { error: error.message || 'Unknown error' });
            }
        });

        // Handle storage and other requests
        socket.on('getStorageContents', async (data) => {
            try {
                if (!rustClient || connectionStatus !== 'connected') {
                    safeEmit(socket, 'error', { error: 'Not connected to Rust server' });
                    return;
                }
                
                // In a real app, this would call rustClient.getEntityInfo()
                // For now, we'll simulate a response
                safeEmit(socket, 'storageContents', {
                    success: true,
                    entityId: data.entityId,
                    contents: [
                        { itemId: 1, amount: 1000, name: 'Wood' },
                        { itemId: 2, amount: 500, name: 'Stone' }
                    ]
                });
            } catch (error) {
                console.error('Error in getStorageContents:', error);
                safeEmit(socket, 'error', { error: error.message || 'Failed to get storage contents' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            hasDisconnected = true;
            
            // If this was the last client, clean up the Rust client
            const connectedClients = Object.keys(io.sockets.sockets).length;
            if (connectedClients === 0) {
                console.log('No more clients connected, cleaning up Rust client');
                await cleanupRustClient();
            }
        });
    });
} 