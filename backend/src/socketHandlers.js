import pkg from '@liamcottle/rustplus.js';
const { RustPlus } = pkg;

let rustClient = null;
let connectionStatus = 'disconnected';
let connectionError = null;
let pendingPairing = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000; // 5 seconds

// Command statistics tracking
const commandStats = {
    box: { uses: 0, lastUsed: null },
    recycle: { uses: 0, lastUsed: null },
    uptime: { uses: 0, lastUsed: null }
};

// Function to update command statistics
const updateCommandStats = (command) => {
    commandStats[command] = {
        uses: (commandStats[command]?.uses || 0) + 1,
        lastUsed: new Date().toISOString()
    };
};

const cleanupRustClient = async () => {
    if (rustClient) {
        try {
            console.log('🔌 Cleaning up Rust client...');
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

const attemptReconnect = async (socket) => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnection attempts reached');
        connectionError = 'Max reconnection attempts reached';
        safeEmit(socket, 'connectionStatus', { status: 'disconnected', error: connectionError });
        return;
    }

    console.log(`🔄 Attempting reconnection (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
    reconnectAttempts++;
    
    try {
        await cleanupRustClient();
        await initializeRustClient(socket);
    } catch (error) {
        console.error('❌ Reconnection failed:', error);
        setTimeout(() => attemptReconnect(socket), RECONNECT_DELAY);
    }
};

const initializeRustClient = async (socket) => {
    try {
        console.log('🚀 Initializing Rust client...');
        rustClient = new RustPlus();
        
        // Set up event handlers
        rustClient.on('connected', () => {
            console.log('✅ Rust client connected successfully');
            connectionStatus = 'connected';
            connectionError = null;
            reconnectAttempts = 0;
            safeEmit(socket, 'connectionStatus', { status: connectionStatus });
        });

        rustClient.on('disconnected', () => {
            console.log('⚠️ Rust client disconnected');
            connectionStatus = 'disconnected';
            safeEmit(socket, 'connectionStatus', { status: connectionStatus });
            attemptReconnect(socket);
        });

        rustClient.on('error', (error) => {
            console.error('❌ Rust client error:', error);
            connectionError = error.message;
            safeEmit(socket, 'connectionStatus', { status: 'error', error: connectionError });
        });

        // Connect to the Rust server
        await rustClient.connect();
    } catch (error) {
        console.error('❌ Failed to initialize Rust client:', error);
        throw error;
    }
};

// Helper for consistent socket response with error handling
const safeEmit = (socket, event, data) => {
    try {
        if (socket && socket.connected) {
            socket.emit(event, data);
        }
    } catch (error) {
        console.error(`❌ Error emitting ${event}:`, error);
    }
};

export function setupSocketHandlers(io) {
    // Middleware for authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                console.warn('⚠️ Socket connection attempt without token');
                return next(new Error('Authentication error: No token provided'));
            }
            
            console.log(`🔑 Socket authenticated with token ${token.substring(0, 5)}...`);
            next();
        } catch (error) {
            console.error('❌ Authentication error:', error);
            next(new Error('Authentication error: ' + (error.message || 'Unknown error')));
        }
    });

    io.on('connection', (socket) => {
        console.log(`👤 Client connected: ${socket.id}`);
        
        // Track socket disconnections for cleanup
        let hasDisconnected = false;

        // Send initial connection status
        safeEmit(socket, 'connectionStatus', {
            status: connectionStatus,
            error: connectionError
        });

        // Handle command statistics request
        socket.on('getCommandStats', () => {
            safeEmit(socket, 'commandStats', commandStats);
        });

        // Handle command usage
        socket.on('commandUsed', (command) => {
            if (commandStats[command]) {
                updateCommandStats(command);
                safeEmit(socket, 'commandStats', commandStats);
            }
        });

        // Handle automatic pairing
        socket.on('startPairing', async () => {
            console.log('🤝 Start pairing request received');
            
            try {
                await cleanupRustClient();
                await initializeRustClient(socket);
            } catch (error) {
                console.error('❌ Error in startPairing:', error);
                connectionStatus = 'error';
                connectionError = error.message || 'Unknown error during pairing';
                safeEmit(socket, 'pairingError', { error: connectionError });
                attemptReconnect(socket);
            }
        });

        // Handle storage and other requests
        socket.on('getStorageContents', async (data) => {
            try {
                if (!rustClient || connectionStatus !== 'connected') {
                    console.warn('⚠️ Storage request while disconnected');
                    safeEmit(socket, 'error', { error: 'Not connected to Rust server' });
                    return;
                }
                
                console.log(`📦 Fetching storage contents for entity ${data.entityId}`);
                const contents = await rustClient.getEntityInfo(data.entityId);
                safeEmit(socket, 'storageContents', {
                    success: true,
                    entityId: data.entityId,
                    contents: contents
                });
            } catch (error) {
                console.error('❌ Error in getStorageContents:', error);
                safeEmit(socket, 'error', { error: error.message || 'Failed to get storage contents' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`👋 Client disconnected: ${socket.id}`);
            hasDisconnected = true;
            
            // If this was the last client, clean up the Rust client
            const connectedClients = Object.keys(io.sockets.sockets).length;
            if (connectedClients === 0) {
                console.log('🔌 No more clients connected, cleaning up Rust client');
                await cleanupRustClient();
            }
        });
    });
} 