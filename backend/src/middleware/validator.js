import Joi from 'joi';
import { AppError } from '../utils/errors.js';

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(new AppError(errorMessage, 400));
        }

        next();
    };
};

// Validation schemas
export const schemas = {
    login: Joi.object({
        username: Joi.string().required().min(3).max(50),
        password: Joi.string().required().min(6)
    }),

    register: Joi.object({
        username: Joi.string().required().min(3).max(50),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    }),

    updateUser: Joi.object({
        username: Joi.string().min(3).max(50),
        email: Joi.string().email(),
        currentPassword: Joi.string().min(6),
        newPassword: Joi.string().min(6)
    }),

    serverInfo: Joi.object({
        ip: Joi.string().required().ip(),
        port: Joi.number().required().min(1).max(65535),
        playerToken: Joi.string().required(),
        playerId: Joi.string().required()
    })
}; 