import { Router } from 'express';
import { Scene, Device } from '../models/Index.js';
import { AppError } from '../utils/errorHandlers.js';
import logger from '../utils/logger.js';
import { socketManager } from '../socketHandlers.js';
import { cache } from '../utils/cache.js';

const router = Router();

/**
 * Scene Controller
 * Handles all scene-related operations
 */
const sceneController = {
    getAllScenes: async (req, res) => {
        try {
            const scenes = await Scene.findAll();
            res.json(scenes);
        } catch (error) {
            console.error('Get all scenes error:', error);
            res.status(500).json({ error: 'Failed to get scenes' });
        }
    },

    createScene: async (req, res) => {
        try {
            const scene = await Scene.create(req.body);
            res.status(201).json(scene);
        } catch (error) {
            console.error('Create scene error:', error);
            res.status(500).json({ error: 'Failed to create scene' });
        }
    },

    getScene: async (req, res) => {
        try {
            const scene = await Scene.findByPk(req.params.id);
            if (!scene) {
                return res.status(404).json({ error: 'Scene not found' });
            }
            res.json(scene);
        } catch (error) {
            console.error('Get scene error:', error);
            res.status(500).json({ error: 'Failed to get scene' });
        }
    },

    updateScene: async (req, res) => {
        try {
            const scene = await Scene.findByPk(req.params.id);
            if (!scene) {
                return res.status(404).json({ error: 'Scene not found' });
            }
            await scene.update(req.body);
            res.json(scene);
        } catch (error) {
            console.error('Update scene error:', error);
            res.status(500).json({ error: 'Failed to update scene' });
        }
    },

    deleteScene: async (req, res) => {
        try {
            const scene = await Scene.findByPk(req.params.id);
            if (!scene) {
                return res.status(404).json({ error: 'Scene not found' });
            }
            await scene.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Delete scene error:', error);
            res.status(500).json({ error: 'Failed to delete scene' });
        }
    }
};

// Routes
router.post('/', sceneController.createScene.bind(sceneController));
router.get('/', sceneController.getAllScenes.bind(sceneController));
router.get('/:id', sceneController.getScene.bind(sceneController));
router.put('/:id', sceneController.updateScene.bind(sceneController));
router.delete('/:id', sceneController.deleteScene.bind(sceneController));

export { router as sceneController }; 