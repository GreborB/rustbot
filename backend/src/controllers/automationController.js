import { Router } from 'express';
import { Automation } from '../models/Automation.js';
import { Scene } from '../models/Scene.js';
import { AppError } from '../utils/errorHandlers.js';
import logger from '../utils/logger.js';
import { socketManager } from '../socketHandlers.js';
import { cache } from '../utils/cache.js';

const router = Router();

/**
 * Automation Controller
 * Handles all automation-related operations
 */
class AutomationController {
    async createAutomation(req, res, next) {
        try {
            const { name, description, triggers, actions, enabled } = req.body;
            const automation = new Automation({
                name,
                description,
                triggers,
                actions,
                enabled
            });
            await automation.save();
            cache.del('automations');
            socketManager.broadcast('automation:created', automation);
            res.status(201).json(automation);
        } catch (error) {
            next(new AppError('Failed to create automation', 500));
        }
    }

    async getAutomation(req, res, next) {
        try {
            const { id } = req.params;
            const automation = await Automation.findById(id);
            if (!automation) {
                return next(new AppError('Automation not found', 404));
            }
            res.json(automation);
        } catch (error) {
            next(new AppError('Failed to get automation', 500));
        }
    }

    async updateAutomation(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, triggers, actions, enabled } = req.body;
            const automation = await Automation.findByIdAndUpdate(
                id,
                { name, description, triggers, actions, enabled },
                { new: true }
            );
            if (!automation) {
                return next(new AppError('Automation not found', 404));
            }
            cache.del('automations');
            socketManager.broadcast('automation:updated', automation);
            res.json(automation);
        } catch (error) {
            next(new AppError('Failed to update automation', 500));
        }
    }

    async deleteAutomation(req, res, next) {
        try {
            const { id } = req.params;
            const automation = await Automation.findByIdAndDelete(id);
            if (!automation) {
                return next(new AppError('Automation not found', 404));
            }
            cache.del('automations');
            socketManager.broadcast('automation:deleted', { id });
            res.json({ message: 'Automation deleted successfully' });
        } catch (error) {
            next(new AppError('Failed to delete automation', 500));
        }
    }

    async listAutomations(req, res, next) {
        try {
            const cached = cache.get('automations');
            if (cached) {
                return res.json(cached);
            }
            const automations = await Automation.find();
            cache.set('automations', automations);
            res.json(automations);
        } catch (error) {
            next(new AppError('Failed to list automations', 500));
        }
    }

    async toggleAutomation(req, res, next) {
        try {
            const { id } = req.params;
            const cacheKey = `automation:${id}`;

            const automation = await Automation.findById(id);
            if (!automation) {
                throw new AppError('Automation not found', 404, 'AUTOMATION_NOT_FOUND');
            }

            automation.enabled = !automation.enabled;
            await automation.save();
            await cache.set(cacheKey, automation, 300);

            // Notify connected clients
            socketManager.broadcastAutomationUpdate(automation);

            logger.info('Automation toggled', { 
                automationId: automation._id, 
                enabled: automation.enabled 
            });

            res.json({
                success: true,
                data: {
                    automation: this._formatAutomationResponse(automation)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    validateTrigger(trigger) {
        if (!trigger || !trigger.type) return false;

        switch (trigger.type) {
            case 'time':
                return trigger.value && typeof trigger.value === 'string';
            case 'device':
                return trigger.deviceId && trigger.condition;
            case 'scene':
                return trigger.sceneId;
            default:
                return false;
        }
    }

    validateActions(actions) {
        if (!Array.isArray(actions) || actions.length === 0) return false;

        return actions.every(action => {
            if (!action.type) return false;

            switch (action.type) {
                case 'device':
                    return action.deviceId && action.command;
                case 'scene':
                    return action.sceneId;
                default:
                    return false;
            }
        });
    }

    async executeAutomation(automation) {
        if (!automation.enabled) return;
        const conditionsMet = await this.checkConditions(automation.conditions);
        if (!conditionsMet) return;
        await this.executeActions(automation.actions);
    }

    async checkConditions(conditions) {
        if (!conditions || conditions.length === 0) return true;
        // Add condition checking logic here
        return true;
    }

    async executeActions(actions) {
        for (const action of actions) {
            await this.executeAction(action);
        }
    }

    async executeAction(action) {
        switch (action.type) {
            case 'device':
                // Add device action execution logic
                break;
            case 'scene':
                // Add scene action execution logic
                break;
            default:
                logger.warn(`Unknown action type: ${action.type}`);
        }
    }

    _formatAutomationResponse(automation) {
        return {
            id: automation._id,
            name: automation.name,
            description: automation.description,
            trigger: automation.trigger,
            actions: automation.actions,
            conditions: automation.conditions,
            enabled: automation.enabled,
            lastUpdated: automation.updatedAt,
            createdAt: automation.createdAt
        };
    }
}

export const automationController = new AutomationController();
export default router; 