import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import Joi from 'joi';

// Validation schemas
const schemas = {
  user: {
    register: Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email(),
      password: Joi.string().min(6).max(100).required(),
    }),
    login: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }),
    update: Joi.object({
      username: Joi.string().min(3).max(50),
      email: Joi.string().email(),
      password: Joi.string().min(6).max(100),
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

// Scene validation schema
const sceneSchema = {
  name: {
    isString: true,
    notEmpty: true,
    errorMessage: 'Scene name is required'
  },
  description: {
    optional: true,
    isString: true
  },
  actions: {
    isArray: true,
    notEmpty: true,
    errorMessage: 'Scene must have at least one action'
  },
  'actions.*.deviceId': {
    isInt: true,
    notEmpty: true,
    errorMessage: 'Each action must have a device ID'
  },
  'actions.*.command': {
    isString: true,
    notEmpty: true,
    errorMessage: 'Each action must have a command'
  },
  'actions.*.params': {
    optional: true,
    isObject: true
  }
};

// Scene schedule validation schema
const sceneScheduleSchema = {
  name: {
    isString: true,
    notEmpty: true,
    errorMessage: 'Schedule name is required'
  },
  startTime: {
    isString: true,
    notEmpty: true,
    errorMessage: 'Start time is required'
  },
  endTime: {
    optional: true,
    isString: true
  },
  repeatType: {
    isIn: {
      options: [['none', 'daily', 'weekly', 'monthly']],
      errorMessage: 'Repeat type must be none, daily, weekly, or monthly'
    }
  },
  daysOfWeek: {
    optional: true,
    isArray: true,
    custom: {
      options: (value) => {
        if (!value) return true;
        return value.every(day => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day));
      },
      errorMessage: 'Days of week must be valid weekdays'
    }
  },
  daysOfMonth: {
    optional: true,
    isArray: true,
    custom: {
      options: (value) => {
        if (!value) return true;
        return value.every(day => day >= 1 && day <= 31);
      },
      errorMessage: 'Days of month must be between 1 and 31'
    }
  },
  isActive: {
    isBoolean: true,
    default: true
  }
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
export const validateScene = createValidationMiddleware(sceneSchema);
export const validateSceneUpdate = createValidationMiddleware(schemas.scene.update);
export const validateAutomation = createValidationMiddleware(schemas.automation.create);
export const validateAutomationUpdate = createValidationMiddleware(schemas.automation.update);
export const validateSceneSchedule = createValidationMiddleware(sceneScheduleSchema); 