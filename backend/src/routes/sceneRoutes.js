import express from 'express';
import { Scene } from '../models/Index.js';
import { authenticate } from '../middleware/auth.js';
import { validateScene } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all scenes for the authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const scenes = await Scene.findAll({
      where: { userId: req.user.id },
      include: ['devices'],
    });
    res.json(scenes);
  } catch (error) {
    logger.error('Error fetching scenes:', error);
    next(error);
  }
});

// Get a single scene
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const scene = await Scene.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: ['devices'],
    });
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }
    res.json(scene);
  } catch (error) {
    logger.error('Error fetching scene:', error);
    next(error);
  }
});

// Create a new scene
router.post('/', authenticate, validateScene, async (req, res, next) => {
  try {
    const scene = await Scene.create({
      ...req.body,
      userId: req.user.id,
    });
    if (req.body.deviceIds) {
      await scene.setDevices(req.body.deviceIds);
    }
    const createdScene = await Scene.findByPk(scene.id, {
      include: ['devices'],
    });
    res.status(201).json(createdScene);
  } catch (error) {
    logger.error('Error creating scene:', error);
    next(error);
  }
});

// Update a scene
router.put('/:id', authenticate, validateScene, async (req, res, next) => {
  try {
    const [updated] = await Scene.update(req.body, {
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!updated) {
      return res.status(404).json({ message: 'Scene not found' });
    }
    const scene = await Scene.findByPk(req.params.id, {
      include: ['devices'],
    });
    if (req.body.deviceIds) {
      await scene.setDevices(req.body.deviceIds);
    }
    res.json(scene);
  } catch (error) {
    logger.error('Error updating scene:', error);
    next(error);
  }
});

// Delete a scene
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await Scene.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Scene not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting scene:', error);
    next(error);
  }
});

// Trigger a scene
router.post('/:id/trigger', authenticate, async (req, res, next) => {
  try {
    const scene = await Scene.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: ['devices'],
    });
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }
    // TODO: Implement scene triggering logic
    res.json({ message: 'Scene triggered successfully' });
  } catch (error) {
    logger.error('Error triggering scene:', error);
    next(error);
  }
});

export default router; 