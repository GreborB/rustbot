import express from 'express';
import { Automation } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateAutomation } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all automations for the authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const automations = await Automation.findAll({
      where: { userId: req.user.id },
      include: ['triggerDevice', 'actionScene'],
    });
    res.json(automations);
  } catch (error) {
    logger.error('Error fetching automations:', error);
    next(error);
  }
});

// Get a single automation
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const automation = await Automation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: ['triggerDevice', 'actionScene'],
    });
    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    res.json(automation);
  } catch (error) {
    logger.error('Error fetching automation:', error);
    next(error);
  }
});

// Create a new automation
router.post('/', authenticate, validateAutomation, async (req, res, next) => {
  try {
    const automation = await Automation.create({
      ...req.body,
      userId: req.user.id,
    });
    const createdAutomation = await Automation.findByPk(automation.id, {
      include: ['triggerDevice', 'actionScene'],
    });
    res.status(201).json(createdAutomation);
  } catch (error) {
    logger.error('Error creating automation:', error);
    next(error);
  }
});

// Update an automation
router.put('/:id', authenticate, validateAutomation, async (req, res, next) => {
  try {
    const [updated] = await Automation.update(req.body, {
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!updated) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    const automation = await Automation.findByPk(req.params.id, {
      include: ['triggerDevice', 'actionScene'],
    });
    res.json(automation);
  } catch (error) {
    logger.error('Error updating automation:', error);
    next(error);
  }
});

// Delete an automation
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await Automation.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting automation:', error);
    next(error);
  }
});

// Toggle automation status
router.patch('/:id/toggle', authenticate, async (req, res, next) => {
  try {
    const automation = await Automation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }
    automation.isActive = !automation.isActive;
    await automation.save();
    res.json(automation);
  } catch (error) {
    logger.error('Error toggling automation:', error);
    next(error);
  }
});

export default router; 