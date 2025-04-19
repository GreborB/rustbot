import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import Joi from 'joi';

// Validation schemas
const schemas = {
  user: {
    register: Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required(),
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
    update: Joi.object({
      username: Joi.string().min(3).max(50),
      email: Joi.string().email(),
      password: Joi.string().min(8).max(128),
    }),
  },
  device: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      type: Joi.string().required(),
      ipAddress: Joi.string().ip(),
      port: Joi.number().min(1).max(65535),
      metadata: Joi.object(),
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(100),
      type: Joi.string(),
      ipAddress: Joi.string().ip(),
      port: Joi.number().min(1).max(65535),
      metadata: Joi.object(),
    }),
  },
  scene: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string(),
      actions: Joi.array().items(
        Joi.object({
          deviceId: Joi.string().required(),
          command: Joi.string().required(),
        })
      ).min(1).required(),
      schedule: Joi.object(),
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string(),
      actions: Joi.array().items(
        Joi.object({
          deviceId: Joi.string().required(),
          command: Joi.string().required(),
        })
      ).min(1),
      schedule: Joi.object(),
    }),
  },
  automation: {
    create: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string(),
      trigger: Joi.object({
        type: Joi.string().required(),
        condition: Joi.any().required(),
      }).required(),
      action: Joi.object({
        type: Joi.string().required(),
        target: Joi.any().required(),
      }).required(),
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string(),
      trigger: Joi.object({
        type: Joi.string().required(),
        condition: Joi.any().required(),
      }),
      action: Joi.object({
        type: Joi.string().required(),
        target: Joi.any().required(),
      }),
    }),
  },
};

// Validation middleware factory
export const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      logger.error('Validation error:', error.details);
      return next(new AppError(error.details[0].message, 400));
    }
    next();
  };
};

// Specific validation middleware
export const validateUser = createValidationMiddleware(schemas.user.register);
export const validateLogin = createValidationMiddleware(schemas.user.login);
export const validateUserUpdate = createValidationMiddleware(schemas.user.update);
export const validateDevice = createValidationMiddleware(schemas.device.create);
export const validateDeviceUpdate = createValidationMiddleware(schemas.device.update);
export const validateScene = createValidationMiddleware(schemas.scene.create);
export const validateSceneUpdate = createValidationMiddleware(schemas.scene.update);
export const validateAutomation = createValidationMiddleware(schemas.automation.create);
export const validateAutomationUpdate = createValidationMiddleware(schemas.automation.update); 