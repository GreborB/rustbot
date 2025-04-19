import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
    userController,
    deviceController,
    sceneController,
    automationController
} from '../controllers/index.js';

const router = express.Router();

// Auth routes
router.post('/auth/login', validate('login'), userController.login);
router.post('/auth/register', validate('register'), userController.register);
router.post('/auth/logout', authenticate, userController.logout);
router.get('/auth/verify', authenticate, userController.verifyToken);

// User routes (protected)
router.get('/users/me', authenticate, userController.getCurrentUser);
router.put('/users/me', authenticate, validate('userUpdate'), userController.updateUser);

// Device routes (protected)
router.get('/devices', authenticate, deviceController.listDevices);
router.post('/devices', authenticate, validate('deviceCreate'), deviceController.createDevice);
router.get('/devices/:id', authenticate, deviceController.getDevice);
router.put('/devices/:id', authenticate, validate('deviceUpdate'), deviceController.updateDevice);
router.delete('/devices/:id', authenticate, deviceController.deleteDevice);
router.put('/devices/:id/toggle', authenticate, deviceController.toggleDevice);

// Scene routes (protected)
router.get('/scenes', authenticate, sceneController.listScenes);
router.post('/scenes', authenticate, validate('sceneCreate'), sceneController.createScene);
router.get('/scenes/:id', authenticate, sceneController.getScene);
router.put('/scenes/:id', authenticate, validate('sceneUpdate'), sceneController.updateScene);
router.delete('/scenes/:id', authenticate, sceneController.deleteScene);
router.post('/scenes/:id/execute', authenticate, sceneController.executeScene);

// Automation routes (protected)
router.get('/automations', authenticate, automationController.listAutomations);
router.post('/automations', authenticate, validate('automationCreate'), automationController.createAutomation);
router.get('/automations/:id', authenticate, automationController.getAutomation);
router.put('/automations/:id', authenticate, validate('automationUpdate'), automationController.updateAutomation);
router.delete('/automations/:id', authenticate, automationController.deleteAutomation);
router.put('/automations/:id/toggle', authenticate, automationController.toggleAutomation);

export default router; 