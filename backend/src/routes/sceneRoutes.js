import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateScene, validateSceneSchedule } from '../middleware/validation.js';
import { sceneService } from '../services/sceneService.js';
import { sceneScheduler } from '../services/sceneScheduler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all scenes for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const scenes = await sceneService.listScenes(req.user.id);
    res.json(scenes);
  } catch (error) {
    logger.error('Failed to list scenes:', error);
    res.status(500).json({ error: 'Failed to list scenes' });
  }
});

// Get a specific scene
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scene = await sceneService.getScene(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    res.json(scene);
  } catch (error) {
    logger.error(`Failed to get scene ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get scene' });
  }
});

// Create a new scene
router.post('/', authenticate, validateScene, async (req, res) => {
  try {
    const scene = await sceneService.createScene({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(scene);
  } catch (error) {
    logger.error('Failed to create scene:', error);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// Update a scene
router.put('/:id', authenticate, validateScene, async (req, res) => {
  try {
    const scene = await sceneService.updateScene(req.params.id, req.body);
    res.json(scene);
  } catch (error) {
    logger.error(`Failed to update scene ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// Delete a scene
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await sceneService.deleteScene(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to delete scene ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

// Execute a scene
router.post('/:id/execute', authenticate, async (req, res) => {
  try {
    const scene = await sceneService.getScene(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    await sceneService.executeScene(scene);
    res.json({ message: 'Scene executed successfully' });
  } catch (error) {
    logger.error(`Failed to execute scene ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to execute scene' });
  }
});

// Schedule management routes
router.post('/:id/schedules', authenticate, validateSceneSchedule, async (req, res) => {
  try {
    const scene = await sceneService.getScene(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const schedule = await sceneScheduler.addSchedule({
      ...req.body,
      sceneId: scene.id
    });

    res.status(201).json(schedule);
  } catch (error) {
    logger.error(`Failed to create schedule for scene ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

router.put('/:id/schedules/:scheduleId', authenticate, validateSceneSchedule, async (req, res) => {
  try {
    const schedule = await sceneScheduler.updateSchedule(req.params.scheduleId, req.body);
    res.json(schedule);
  } catch (error) {
    logger.error(`Failed to update schedule ${req.params.scheduleId}:`, error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

router.delete('/:id/schedules/:scheduleId', authenticate, async (req, res) => {
  try {
    await sceneScheduler.removeSchedule(req.params.scheduleId);
    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to delete schedule ${req.params.scheduleId}:`, error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

export default router; 