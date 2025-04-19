import { RustPlus } from '@liamcottle/rustplus.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { User } from '../models/Index.js';

class RustService {
    constructor() {
        this.rustPlus = null;
        this.connected = false;
        this.devices = new Map();
        this.pairingRequests = new Map();
        this.autoReconnect = true;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    async initiatePairing(userId, serverIp, serverPort) {
        try {
            const user = await User.findByPk(userId);
            if (!user || !user.steamId) {
                throw new Error('User not found or not linked to Steam');
            }

            // Create a new RustPlus instance for pairing
            this.rustPlus = new RustPlus(serverIp, serverPort);
            
            // Set up event handlers for pairing
            this.rustPlus.on('pairing', (data) => {
                this.pairingRequests.set(userId, {
                    serverIp,
                    serverPort,
                    pairingCode: data.pairingCode,
                    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
                });
                logger.info(`Pairing initiated for user ${userId} with code ${data.pairingCode}`);
            });

            this.rustPlus.on('paired', async (data) => {
                if (this.pairingRequests.has(userId)) {
                    const request = this.pairingRequests.get(userId);
                    await this.completePairing(userId, request.serverIp, request.serverPort, data.playerToken, data.playerId);
                    this.pairingRequests.delete(userId);
                }
            });

            // Start the pairing process
            await this.rustPlus.startPairing();
            return this.pairingRequests.get(userId);
        } catch (error) {
            logger.error('Failed to initiate pairing:', error);
            throw error;
        }
    }

    async completePairing(userId, serverIp, serverPort, playerToken, playerId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Store the pairing information
            await user.update({
                rustServerIp: serverIp,
                rustServerPort: serverPort,
                rustPlayerToken: playerToken,
                rustPlayerId: playerId,
                rustLastPairing: new Date()
            });

            // Connect to the server
            await this.connect(serverIp, serverPort, playerToken, playerId);
            logger.info(`Successfully paired and connected user ${userId} to Rust server`);
            return true;
        } catch (error) {
            logger.error('Failed to complete pairing:', error);
            throw error;
        }
    }

    async autoConnect(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user || !user.rustPlayerToken || !user.rustPlayerId) {
                throw new Error('User not found or not paired with Rust server');
            }

            // Check if we need to reconnect
            if (this.connected && 
                this.rustPlus.serverIp === user.rustServerIp && 
                this.rustPlus.serverPort === user.rustServerPort) {
                return true;
            }

            // Connect using stored credentials
            await this.connect(
                user.rustServerIp,
                user.rustServerPort,
                user.rustPlayerToken,
                user.rustPlayerId
            );

            return true;
        } catch (error) {
            logger.error('Auto-connect error:', error);
            throw error;
        }
    }

    async connect(serverIp, serverPort, playerToken, playerId) {
        try {
            this.rustPlus = new RustPlus(serverIp, serverPort, playerToken, playerId);
            
            // Set up event handlers
            this.rustPlus.on('connected', () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                logger.info('Connected to Rust server');
            });

            this.rustPlus.on('disconnected', () => {
                this.connected = false;
                logger.info('Disconnected from Rust server');
                
                // Attempt to reconnect if autoReconnect is enabled
                if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        this.connect(serverIp, serverPort, playerToken, playerId)
                            .catch(error => logger.error('Reconnect failed:', error));
                    }, 5000); // Wait 5 seconds before reconnecting
                }
            });

            this.rustPlus.on('error', (error) => {
                logger.error('Rust server error:', error);
            });

            // Connect to the server
            await this.rustPlus.connect();
            return true;
        } catch (error) {
            logger.error('Failed to connect to Rust server:', error);
            throw error;
        }
    }

    async disconnect() {
        this.autoReconnect = false;
        if (this.rustPlus) {
            await this.rustPlus.disconnect();
            this.connected = false;
        }
    }

    async getServerInfo() {
        if (!this.connected) {
            throw new Error('Not connected to Rust server');
        }

        try {
            const info = await this.rustPlus.getInfo();
            return {
                name: info.name,
                players: info.players,
                maxPlayers: info.maxPlayers,
                seed: info.seed,
                size: info.size,
                time: info.time
            };
        } catch (error) {
            logger.error('Failed to get server info:', error);
            throw error;
        }
    }

    async getEntityInfo(entityId) {
        if (!this.connected) {
            throw new Error('Not connected to Rust server');
        }

        try {
            const info = await this.rustPlus.getEntityInfo(entityId);
            return {
                id: info.id,
                type: info.type,
                value: info.value,
                capacity: info.capacity,
                hasProtection: info.hasProtection,
                protectionExpiry: info.protectionExpiry
            };
        } catch (error) {
            logger.error('Failed to get entity info:', error);
            throw error;
        }
    }

    async setEntityValue(entityId, value) {
        if (!this.connected) {
            throw new Error('Not connected to Rust server');
        }

        try {
            await this.rustPlus.setEntityValue(entityId, value);
            return true;
        } catch (error) {
            logger.error('Failed to set entity value:', error);
            throw error;
        }
    }

    async getMapMarkers() {
        if (!this.connected) {
            throw new Error('Not connected to Rust server');
        }

        try {
            const markers = await this.rustPlus.getMapMarkers();
            return markers.map(marker => ({
                id: marker.id,
                type: marker.type,
                x: marker.x,
                z: marker.z,
                name: marker.name
            }));
        } catch (error) {
            logger.error('Failed to get map markers:', error);
            throw error;
        }
    }

    async sendTeamMessage(message) {
        if (!this.connected) {
            throw new Error('Not connected to Rust server');
        }

        try {
            await this.rustPlus.sendTeamMessage(message);
            return true;
        } catch (error) {
            logger.error('Failed to send team message:', error);
            throw error;
        }
    }

    async getPairingStatus(userId) {
        const request = this.pairingRequests.get(userId);
        if (!request) {
            return { status: 'not_started' };
        }

        if (Date.now() > request.expiresAt) {
            this.pairingRequests.delete(userId);
            return { status: 'expired' };
        }

        return {
            status: 'pending',
            pairingCode: request.pairingCode,
            expiresAt: request.expiresAt
        };
    }

    async getConnectionStatus(userId) {
        const user = await User.findByPk(userId);
        if (!user || !user.rustPlayerToken || !user.rustPlayerId) {
            return { status: 'not_paired' };
        }

        return {
            status: this.connected ? 'connected' : 'disconnected',
            serverIp: user.rustServerIp,
            serverPort: user.rustServerPort,
            lastPairing: user.rustLastPairing
        };
    }
}

export default new RustService(); 