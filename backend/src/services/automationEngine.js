import { Automation } from '../models/Automation.js';
import { logger } from '../utils/logger.js';

class AutomationEngine {
  constructor() {
    this.activeAutomations = new Map();
    this.cooldowns = new Map();
  }

  async initialize() {
    // Load active automations
    const automations = await Automation.findAll({
      where: { isActive: true },
      include: ['triggerDevice', 'actionScene']
    });

    for (const automation of automations) {
      this.activeAutomations.set(automation.id, automation);
    }

    logger.info(`Automation engine initialized with ${automations.length} active automations`);
  }

  async handleDeviceStateChange(deviceState) {
    try {
      // Get all automations triggered by this device
      const automations = Array.from(this.activeAutomations.values())
        .filter(auto => auto.triggerDeviceId === deviceState.deviceId);

      for (const automation of automations) {
        await this.processAutomation(automation, deviceState);
      }
    } catch (error) {
      logger.error('Error handling device state change:', error);
    }
  }

  async processAutomation(automation, deviceState) {
    try {
      // Check cooldown
      if (this.isInCooldown(automation)) {
        return;
      }

      // Evaluate trigger conditions
      if (await automation.evaluateTrigger(deviceState)) {
        // Execute automation
        await automation.execute();
        
        // Set cooldown
        if (automation.cooldown > 0) {
          this.setCooldown(automation);
        }
      }
    } catch (error) {
      logger.error(`Error processing automation ${automation.id}:`, error);
    }
  }

  isInCooldown(automation) {
    const cooldownEnd = this.cooldowns.get(automation.id);
    if (!cooldownEnd) return false;

    if (Date.now() >= cooldownEnd) {
      this.cooldowns.delete(automation.id);
      return false;
    }

    return true;
  }

  setCooldown(automation) {
    const cooldownEnd = Date.now() + (automation.cooldown * 1000);
    this.cooldowns.set(automation.id, cooldownEnd);
  }

  async addAutomation(automation) {
    if (automation.isActive) {
      this.activeAutomations.set(automation.id, automation);
    }
  }

  async removeAutomation(automationId) {
    this.activeAutomations.delete(automationId);
    this.cooldowns.delete(automationId);
  }

  async updateAutomation(automation) {
    if (automation.isActive) {
      this.activeAutomations.set(automation.id, automation);
    } else {
      this.activeAutomations.delete(automation.id);
      this.cooldowns.delete(automation.id);
    }
  }

  getActiveAutomations() {
    return Array.from(this.activeAutomations.values());
  }
}

export const automationEngine = new AutomationEngine(); 