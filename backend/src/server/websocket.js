import { WebSocketServer } from 'ws';
import { verifyToken } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { Device, Scene } from '../models/index.js';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.deviceConnections = new Map();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from URL query
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        // Verify token and get user
        const decoded = verifyToken(token);
        const userId = decoded.id;

        // Store connection
        this.clients.set(ws, { userId });

        // Handle messages
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            await this.handleMessage(ws, data);
          } catch (error) {
            logger.error('Error handling message:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
          }
        });

        // Handle disconnection
        ws.on('close', () => {
          this.handleDisconnection(ws);
        });

        // Send connection confirmation
        ws.send(JSON.stringify({ type: 'connected', userId }));
      } catch (error) {
        logger.error('WebSocket connection error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  async handleMessage(ws, data) {
    const { type, payload } = data;
    const { userId } = this.clients.get(ws);

    switch (type) {
      case 'device_connect':
        await this.handleDeviceConnect(ws, userId, payload);
        break;
      case 'device_status':
        await this.handleDeviceStatus(ws, userId, payload);
        break;
      case 'device_command':
        await this.handleDeviceCommand(ws, userId, payload);
        break;
      case 'scene_trigger':
        await this.handleSceneTrigger(ws, userId, payload);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  async handleDeviceConnect(ws, userId, { deviceId }) {
    try {
      const device = await Device.findOne({
        where: { id: deviceId, userId }
      });

      if (!device) {
        ws.send(JSON.stringify({ error: 'Device not found' }));
        return;
      }

      this.deviceConnections.set(deviceId, ws);
      device.status = 'online';
      device.lastSeen = new Date();
      await device.save();

      // Notify all clients about device status change
      this.broadcastToUser(userId, {
        type: 'device_status',
        payload: { deviceId, status: 'online' }
      });
    } catch (error) {
      logger.error('Error handling device connect:', error);
      ws.send(JSON.stringify({ error: 'Failed to connect device' }));
    }
  }

  async handleDeviceStatus(ws, userId, { deviceId, status, data }) {
    try {
      const device = await Device.findOne({
        where: { id: deviceId, userId }
      });

      if (!device) {
        ws.send(JSON.stringify({ error: 'Device not found' }));
        return;
      }

      device.status = status;
      device.lastSeen = new Date();
      device.metadata = { ...device.metadata, ...data };
      await device.save();

      // Broadcast status update to all user's clients
      this.broadcastToUser(userId, {
        type: 'device_status',
        payload: { deviceId, status, data }
      });
    } catch (error) {
      logger.error('Error handling device status:', error);
      ws.send(JSON.stringify({ error: 'Failed to update device status' }));
    }
  }

  async handleDeviceCommand(ws, userId, { deviceId, command, params }) {
    try {
      const device = await Device.findOne({
        where: { id: deviceId, userId }
      });

      if (!device) {
        ws.send(JSON.stringify({ error: 'Device not found' }));
        return;
      }

      const deviceWs = this.deviceConnections.get(deviceId);
      if (!deviceWs) {
        ws.send(JSON.stringify({ error: 'Device not connected' }));
        return;
      }

      // Forward command to device
      deviceWs.send(JSON.stringify({
        type: 'command',
        payload: { command, params }
      }));
    } catch (error) {
      logger.error('Error handling device command:', error);
      ws.send(JSON.stringify({ error: 'Failed to send command' }));
    }
  }

  async handleSceneTrigger(ws, userId, { sceneId }) {
    try {
      const scene = await Scene.findOne({
        where: { id: sceneId, userId },
        include: ['devices']
      });

      if (!scene) {
        ws.send(JSON.stringify({ error: 'Scene not found' }));
        return;
      }

      // Execute scene actions
      for (const device of scene.devices) {
        const deviceWs = this.deviceConnections.get(device.id);
        if (deviceWs) {
          deviceWs.send(JSON.stringify({
            type: 'scene_action',
            payload: { sceneId, action: device.settings }
          }));
        }
      }

      // Notify clients about scene execution
      this.broadcastToUser(userId, {
        type: 'scene_triggered',
        payload: { sceneId }
      });
    } catch (error) {
      logger.error('Error handling scene trigger:', error);
      ws.send(JSON.stringify({ error: 'Failed to trigger scene' }));
    }
  }

  handleDisconnection(ws) {
    const { userId } = this.clients.get(ws);
    this.clients.delete(ws);

    // Find and remove device connection
    for (const [deviceId, deviceWs] of this.deviceConnections.entries()) {
      if (deviceWs === ws) {
        this.deviceConnections.delete(deviceId);
        this.broadcastToUser(userId, {
          type: 'device_status',
          payload: { deviceId, status: 'offline' }
        });
      }
    }
  }

  broadcastToUser(userId, message) {
    for (const [client, data] of this.clients.entries()) {
      if (data.userId === userId) {
        client.send(JSON.stringify(message));
      }
    }
  }
}

export const webSocketManager = new WebSocketManager(); 