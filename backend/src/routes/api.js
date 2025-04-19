import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { errorHandler } from '../utils/errorHandlers.js';
import {
    userController,
    deviceController,
    sceneController,
    automationController
} from '../controllers/index.js';

const router = express.Router();

/**
 * User Routes
 */
router.post('/users', validate('userCreate'), userController.createUser);
router.post('/users/login', validate('userLogin'), userController.login);
router.get('/users/profile', authenticate, userController.getProfile);
router.get('/users', authenticate, validate('pagination'), userController.listUsers);
router.delete('/users/:id', authenticate, userController.deleteUser);

/**
 * Device Routes
 */
router.post('/devices', authenticate, validate('deviceCreate'), deviceController.createDevice);
router.get('/devices', authenticate, validate('pagination'), validate('filter'), deviceController.listDevices);
router.get('/devices/:id', authenticate, deviceController.getDevice);
router.put('/devices/:id/status', authenticate, validate('deviceStatus'), deviceController.updateDeviceStatus);
router.delete('/devices/:id', authenticate, deviceController.deleteDevice);

/**
 * Scene Routes
 */
router.post('/scenes', authenticate, validate('sceneCreate'), sceneController.createScene);
router.get('/scenes', authenticate, validate('pagination'), sceneController.listScenes);
router.get('/scenes/:id', authenticate, sceneController.getScene);
router.post('/scenes/:id/execute', authenticate, sceneController.executeScene);
router.delete('/scenes/:id', authenticate, sceneController.deleteScene);

/**
 * Automation Routes
 */
router.post('/automations', authenticate, validate('automationCreate'), automationController.createAutomation);
router.get('/automations', authenticate, validate('pagination'), automationController.listAutomations);
router.get('/automations/:id', authenticate, automationController.getAutomation);
router.put('/automations/:id/toggle', authenticate, automationController.toggleAutomation);
router.delete('/automations/:id', authenticate, automationController.deleteAutomation);

/**
 * Error Handling
 */
router.use(errorHandler);

export default router; 