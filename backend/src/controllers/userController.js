import { Router } from 'express';
import { User } from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import config from '../config.js';

const router = Router();

/**
 * User Controller
 * Handles all user-related operations
 */
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return next(new AppError('Email already registered', 400));
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON()
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new AppError('Invalid credentials', 401));
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new AppError('Invalid credentials', 401));
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: user.toJSON()
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }
        res.json({ success: true, user: user.toJSON() });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { username, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            user: user.toJSON()
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

export const deleteProfile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Soft delete by setting isActive to false
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

/**
 * List all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const listUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const cacheKey = `users:list:${page}:${limit}`;

        let result = await cache.get(cacheKey);
        if (!result) {
            const { count, rows: users } = await User.findAndCountAll({
                offset,
                limit,
                order: [['createdAt', 'DESC']]
            });
            
            result = {
                users: users.map(user => _formatUserResponse(user)),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            };
            
            await cache.set(cacheKey, result, 60); // Cache for 1 minute
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Format user response
 * @private
 */
const _formatUserResponse = (user) => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
    };
};

const userController = { register, login, getProfile, updateProfile, deleteProfile, listUsers };

// Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.get('/', userController.listUsers);

export { router as userController }; 