import Joi from 'joi';
import { ValidationError } from './errors.js';

/**
 * Common validation patterns
 */
export const patterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    username: /^[a-zA-Z0-9_-]{3,30}$/,
    ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
};

/**
 * Standard validation messages
 */
export const messages = {
    required: '{{#label}} is required',
    invalid: '{{#label}} is invalid',
    min: '{{#label}} must be at least {{#limit}} characters',
    max: '{{#label}} must not exceed {{#limit}} characters',
    email: '{{#label}} must be a valid email address',
    password: '{{#label}} must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    pattern: '{{#label}} does not match the required pattern',
    unique: '{{#label}} must be unique',
    exists: '{{#label}} does not exist',
    type: '{{#label}} must be a {{#type}}',
    array: '{{#label}} must be an array',
    object: '{{#label}} must be an object',
    date: '{{#label}} must be a valid date',
    number: '{{#label}} must be a number',
    integer: '{{#label}} must be an integer',
    boolean: '{{#label}} must be a boolean',
    file: {
        required: 'File is required',
        type: 'Invalid file type',
        size: 'File size exceeds the limit',
    },
};

/**
 * Default validation options
 */
export const defaultOptions = {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
    allowUnknown: false,
    skipFunctions: true,
    presence: 'required',
    noDefaults: false,
    escapeHtml: true,
};

/**
 * Validates data against a schema
 * @param {*} data - Data to validate
 * @param {Object} schema - Joi schema
 * @param {Object} options - Validation options
 * @returns {Promise<{error: Joi.ValidationError, value: *}>}
 */
export const validateData = async (data, schema, options = {}) => {
    try {
        const validationOptions = { ...defaultOptions, ...options };
        const { error, value } = await schema.validateAsync(data, validationOptions);
        return { error, value };
    } catch (error) {
        return { error, value: null };
    }
};

/**
 * Creates a validation middleware function
 * @param {Object} schema - Joi schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const createValidationMiddleware = (schema, source = 'body') => {
    return async (req, res, next) => {
        try {
            const value = await schema.validateAsync(req[source], {
                abortEarly: false,
                stripUnknown: true
            });
            req[source] = value;
            next();
        } catch (error) {
            if (error.isJoi) {
                const details = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }));
                next(new ValidationError('Validation failed', details));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Validates file upload
 * @param {Object} file - File object
 * @param {Object} options - Validation options
 * @returns {Promise<{error: Error, value: Object}>}
 */
export const validateFile = async (file, options = {}) => {
    const {
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        maxSize = 5 * 1024 * 1024, // 5MB
    } = options;

    if (!file) {
        return { error: new Error(messages.file.required), value: null };
    }

    if (!allowedTypes.includes(file.mimetype)) {
        return { error: new Error(messages.file.type), value: null };
    }

    if (file.size > maxSize) {
        return { error: new Error(messages.file.size), value: null };
    }

    return { error: null, value: file };
};

/**
 * Validates multiple schemas
 * @param {Array} validations - Array of objects containing schema and data to validate
 * @returns {Promise} Promise that resolves with validation results
 */
export const validateMultiple = async (validations) => {
    const errors = [];
    const values = {};

    for (const validation of validations) {
        try {
            const value = await validation.schema.validateAsync(validation.data, {
                abortEarly: false,
                stripUnknown: true
            });
            values[validation.schema._flags.label || 'unnamed'] = value;
        } catch (error) {
            if (error.isJoi) {
                errors.push(new ValidationError(error.details[0].message, {
                    field: error.details[0].path.join('.'),
                    value: error.details[0].context.value
                }));
            } else {
                errors.push(error);
            }
        }
    }

    return { errors, values };
}; 