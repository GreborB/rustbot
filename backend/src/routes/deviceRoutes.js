import express from 'express';
import { Device } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateDevice } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all devices for the authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const devices = await Device.findAll({
      where: { userId: req.user.id },
    });
    res.json(devices);
  } catch (error) {
    logger.error('Error fetching devices:', error);
    next(error);
  }
});

// Get a single device
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    logger.error('Error fetching device:', error);
    next(error);
  }
});

// Create a new device
router.post('/', authenticate, validateDevice, async (req, res, next) => {
  try {
    const device = await Device.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(device);
  } catch (error) {
    logger.error('Error creating device:', error);
    next(error);
  }
});

// Update a device
router.put('/:id', authenticate, validateDevice, async (req, res, next) => {
  try {
    const [updated] = await Device.update(req.body, {
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!updated) {
      return res.status(404).json({ message: 'Device not found' });
    }
    const device = await Device.findByPk(req.params.id);
    res.json(device);
  } catch (error) {
    logger.error('Error updating device:', error);
    next(error);
  }
});

// Delete a device
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await Device.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting device:', error);
    next(error);
  }
});

export default router; 