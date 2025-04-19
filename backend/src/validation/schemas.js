import Joi from 'joi';

// Vending machine schemas
export const vendingMachineSchema = Joi.object({
    name: Joi.string().required().min(1).max(64),
    description: Joi.string().max(256),
    location: Joi.string().max(128),
    status: Joi.string().valid('active', 'inactive', 'maintenance'),
    items: Joi.array().items(
        Joi.object({
            name: Joi.string().required().min(1).max(64),
            price: Joi.number().required().min(0),
            quantity: Joi.number().required().min(0),
            description: Joi.string().max(256),
        })
    ).max(100),
});

export const vendingItemSchema = Joi.object({
    name: Joi.string().required().min(1).max(64),
    price: Joi.number().required().min(0),
    quantity: Joi.number().required().min(0),
    description: Joi.string().max(256),
});

// User schemas
export const userSchema = Joi.object({
    username: Joi.string().required().min(3).max(32),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(128),
    role: Joi.string().valid('admin', 'user', 'operator'),
});

export const loginSchema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
});

// Configuration schemas
export const configSchema = Joi.object({
    key: Joi.string().required(),
    value: Joi.any().required(),
    description: Joi.string().max(256),
    type: Joi.string().valid('string', 'number', 'boolean', 'array', 'object'),
});

// Event schemas
export const eventSchema = Joi.object({
    type: Joi.string().required(),
    severity: Joi.string().valid('info', 'warning', 'error', 'critical'),
    message: Joi.string().required(),
    details: Joi.object(),
    timestamp: Joi.date().default(() => new Date()),
});

// Log schemas
export const logSchema = Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error'),
    message: Joi.string().required(),
    meta: Joi.object(),
    timestamp: Joi.date().default(() => new Date()),
});

// Performance metrics schemas
export const metricsSchema = Joi.object({
    cpu: Joi.number().min(0).max(100),
    memory: Joi.number().min(0),
    responseTime: Joi.number().min(0),
    requests: Joi.number().min(0),
    errors: Joi.number().min(0),
    timestamp: Joi.date().default(() => new Date()),
});

// API key schemas
export const apiKeySchema = Joi.object({
    name: Joi.string().required().min(1).max(64),
    description: Joi.string().max(256),
    permissions: Joi.array().items(Joi.string()),
    expiresAt: Joi.date().min('now'),
});

// Search schemas
export const searchSchema = Joi.object({
    query: Joi.string().required(),
    filters: Joi.object(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.object(),
}); 