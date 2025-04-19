import express from 'express';
import { User } from '../models/Index.js';
import { authenticate } from '../middleware/auth.js';
import { validateUser, validateLogin, validateUserUpdate } from '../middleware/validation.js';
import { comparePassword, generateToken } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

// Register a new user
router.post('/register', validateUser, async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Create new user
    const user = await User.create(req.body);
    
    // Generate token
    const token = generateToken({ id: user.id });

    res.status(201).json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    next(error);
  }
});

// Login user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken({ id: user.id });

    res.json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, validateUserUpdate, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Update user
    Object.assign(user, req.body);
    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
});

// Delete user account
router.delete('/profile', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting user profile:', error);
    next(error);
  }
});

export default router; 