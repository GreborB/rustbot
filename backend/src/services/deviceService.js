import { Device } from '../models/index.js';
import { logger } from '../utils/logger.js';

class DeviceService {
  async createDevice(data) {
    try {
      const device = await Device.create(data);
      return device;
    } catch (error) {
      logger.error('Error creating device:', error);
      throw error;
    }
  }

  async getDevice(id) {
    try {
      const device = await Device.findByPk(id);
      if (!device) {
        throw new Error('Device not found');
      }
      return device;
    } catch (error) {
      logger.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDevice(id, data) {
    try {
      const device = await this.getDevice(id);
      await device.update(data);
      return device;
    } catch (error) {
      logger.error('Error updating device:', error);
      throw error;
    }
  }

  async deleteDevice(id) {
    try {
      const device = await this.getDevice(id);
      await device.destroy();
    } catch (error) {
      logger.error('Error deleting device:', error);
      throw error;
    }
  }

  async executeCommand(deviceId, command, params = {}) {
    try {
      const device = await this.getDevice(deviceId);
      // Here you would implement the actual command execution logic
      // This is just a placeholder that logs the command
      logger.info(`Executing command ${command} on device ${deviceId} with params:`, params);
      return { success: true, message: 'Command executed successfully' };
    } catch (error) {
      logger.error('Error executing command:', error);
      throw error;
    }
  }
}

export const deviceService = new DeviceService(); 