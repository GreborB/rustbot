import { Scene, Device } from '../models/Index.js';
import { logger } from '../utils/logger.js';
import { deviceService } from './deviceService.js';

class SceneService {
  async createScene(data) {
    try {
      const scene = await Scene.create(data);
      logger.info(`Created scene ${scene.id}`);
      return scene;
    } catch (error) {
      logger.error('Failed to create scene:', error);
      throw error;
    }
  }

  async updateScene(sceneId, data) {
    try {
      const scene = await Scene.findByPk(sceneId);
      if (!scene) {
        throw new Error('Scene not found');
      }

      await scene.update(data);
      logger.info(`Updated scene ${sceneId}`);
      return scene;
    } catch (error) {
      logger.error(`Failed to update scene ${sceneId}:`, error);
      throw error;
    }
  }

  async deleteScene(sceneId) {
    try {
      const scene = await Scene.findByPk(sceneId);
      if (!scene) {
        throw new Error('Scene not found');
      }

      await scene.destroy();
      logger.info(`Deleted scene ${sceneId}`);
    } catch (error) {
      logger.error(`Failed to delete scene ${sceneId}:`, error);
      throw error;
    }
  }

  async getScene(sceneId) {
    try {
      const scene = await Scene.findByPk(sceneId, {
        include: [{
          model: Device,
          as: 'devices'
        }]
      });

      if (!scene) {
        throw new Error('Scene not found');
      }

      return scene;
    } catch (error) {
      logger.error(`Failed to get scene ${sceneId}:`, error);
      throw error;
    }
  }

  async listScenes(userId) {
    try {
      const scenes = await Scene.findAll({
        where: { userId },
        include: [{
          model: Device,
          as: 'devices'
        }]
      });

      return scenes;
    } catch (error) {
      logger.error('Failed to list scenes:', error);
      throw error;
    }
  }

  async executeScene(scene) {
    try {
      logger.info(`Executing scene ${scene.id}`);

      // Execute each action in sequence
      for (const action of scene.actions) {
        try {
          await this.executeAction(action);
        } catch (error) {
          logger.error(`Failed to execute action in scene ${scene.id}:`, error);
          // Continue with next action even if one fails
        }
      }

      // Update last executed timestamp
      await scene.update({ lastExecuted: new Date() });
      logger.info(`Completed execution of scene ${scene.id}`);
    } catch (error) {
      logger.error(`Failed to execute scene ${scene.id}:`, error);
      throw error;
    }
  }

  async executeAction(action) {
    try {
      const { deviceId, command, params } = action;

      // Get the device
      const device = await Device.findByPk(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Execute the command through the device service
      await deviceService.executeCommand(device, command, params);
      logger.info(`Executed action: ${command} on device ${deviceId}`);
    } catch (error) {
      logger.error(`Failed to execute action:`, error);
      throw error;
    }
  }
}

export const sceneService = new SceneService(); 