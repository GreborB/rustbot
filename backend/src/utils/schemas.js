import Joi from 'joi';
import { patterns, messages } from './validation.js';

/**
 * User Schemas
 */
export const userSchemas = {
    create: Joi.object({
        username: Joi.string()
            .pattern(patterns.username)
            .required()
            .messages(messages),
        email: Joi.string()
            .pattern(patterns.email)
            .required()
            .messages(messages),
        password: Joi.string()
            .pattern(patterns.password)
            .required()
            .messages(messages),
        role: Joi.string()
            .valid('user', 'admin', 'moderator')
            .default('user')
            .messages(messages),
    }),

    update: Joi.object({
        username: Joi.string()
            .pattern(patterns.username)
            .messages(messages),
        email: Joi.string()
            .pattern(patterns.email)
            .messages(messages),
        password: Joi.string()
            .pattern(patterns.password)
            .messages(messages),
        role: Joi.string()
            .valid('user', 'admin', 'moderator')
            .messages(messages),
    }),

    login: Joi.object({
        email: Joi.string()
            .pattern(patterns.email)
            .required()
            .messages(messages),
        password: Joi.string()
            .required()
            .messages(messages),
    }),
};

/**
 * Device Schemas
 */
export const deviceSchemas = {
    create: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages(messages),
        type: Joi.string()
            .valid('switch', 'sensor', 'camera', 'light', 'thermostat')
            .required()
            .messages(messages),
        ipAddress: Joi.string()
            .pattern(patterns.ipAddress)
            .required()
            .messages(messages),
        macAddress: Joi.string()
            .pattern(patterns.macAddress)
            .required()
            .messages(messages),
        location: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages(messages),
        status: Joi.string()
            .valid('active', 'inactive', 'maintenance')
            .default('active')
            .messages(messages),
    }),

    update: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .messages(messages),
        type: Joi.string()
            .valid('switch', 'sensor', 'camera', 'light', 'thermostat')
            .messages(messages),
        ipAddress: Joi.string()
            .pattern(patterns.ipAddress)
            .messages(messages),
        macAddress: Joi.string()
            .pattern(patterns.macAddress)
            .messages(messages),
        location: Joi.string()
            .min(3)
            .max(50)
            .messages(messages),
        status: Joi.string()
            .valid('active', 'inactive', 'maintenance')
            .messages(messages),
    }),
};

/**
 * Scene Schemas
 */
export const sceneSchemas = {
    create: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages(messages),
        description: Joi.string()
            .max(200)
            .messages(messages),
        devices: Joi.array()
            .items(Joi.string().pattern(patterns.uuid))
            .min(1)
            .required()
            .messages(messages),
        actions: Joi.array()
            .items(Joi.object({
                deviceId: Joi.string()
                    .pattern(patterns.uuid)
                    .required()
                    .messages(messages),
                action: Joi.string()
                    .required()
                    .messages(messages),
                value: Joi.any()
                    .required()
                    .messages(messages),
            }))
            .min(1)
            .required()
            .messages(messages),
    }),

    update: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .messages(messages),
        description: Joi.string()
            .max(200)
            .messages(messages),
        devices: Joi.array()
            .items(Joi.string().pattern(patterns.uuid))
            .min(1)
            .messages(messages),
        actions: Joi.array()
            .items(Joi.object({
                deviceId: Joi.string()
                    .pattern(patterns.uuid)
                    .required()
                    .messages(messages),
                action: Joi.string()
                    .required()
                    .messages(messages),
                value: Joi.any()
                    .required()
                    .messages(messages),
            }))
            .min(1)
            .messages(messages),
    }),
};

/**
 * Automation Schemas
 */
export const automationSchemas = {
    create: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages(messages),
        description: Joi.string()
            .max(200)
            .messages(messages),
        trigger: Joi.object({
            type: Joi.string()
                .valid('time', 'device', 'condition')
                .required()
                .messages(messages),
            value: Joi.any()
                .required()
                .messages(messages),
        })
            .required()
            .messages(messages),
        actions: Joi.array()
            .items(Joi.object({
                type: Joi.string()
                    .valid('device', 'scene', 'notification')
                    .required()
                    .messages(messages),
                value: Joi.any()
                    .required()
                    .messages(messages),
            }))
            .min(1)
            .required()
            .messages(messages),
        enabled: Joi.boolean()
            .default(true)
            .messages(messages),
    }),

    update: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .messages(messages),
        description: Joi.string()
            .max(200)
            .messages(messages),
        trigger: Joi.object({
            type: Joi.string()
                .valid('time', 'device', 'condition')
                .required()
                .messages(messages),
            value: Joi.any()
                .required()
                .messages(messages),
        })
            .messages(messages),
        actions: Joi.array()
            .items(Joi.object({
                type: Joi.string()
                    .valid('device', 'scene', 'notification')
                    .required()
                    .messages(messages),
                value: Joi.any()
                    .required()
                    .messages(messages),
            }))
            .min(1)
            .messages(messages),
        enabled: Joi.boolean()
            .messages(messages),
    }),
};

/**
 * Query Schemas
 */
export const querySchemas = {
    pagination: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages(messages),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages(messages),
    }),

    filter: Joi.object({
        search: Joi.string()
            .max(100)
            .messages(messages),
        status: Joi.string()
            .valid('active', 'inactive', 'maintenance')
            .messages(messages),
        type: Joi.string()
            .messages(messages),
        startDate: Joi.date()
            .messages(messages),
        endDate: Joi.date()
            .min(Joi.ref('startDate'))
            .messages(messages),
    }),
};

/**
 * File Schemas
 */
export const fileSchemas = {
    upload: Joi.object({
        file: Joi.object({
            fieldname: Joi.string()
                .required()
                .messages(messages),
            originalname: Joi.string()
                .required()
                .messages(messages),
            encoding: Joi.string()
                .required()
                .messages(messages),
            mimetype: Joi.string()
                .required()
                .messages(messages),
            size: Joi.number()
                .required()
                .messages(messages),
        })
            .required()
            .messages(messages),
    }),
}; 