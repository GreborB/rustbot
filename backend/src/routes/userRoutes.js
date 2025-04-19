import express from 'express';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateUser, validateLogin, validateUserUpdate } from '../middleware/validation.js';
import { generateTokens, verifyToken, generatePasswordResetToken } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again later'
});

// Register a new user
router.post('/register', validateUser, async (req, res, next) => {
  try {
    const { username } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('Username already taken', 409);
    }

    // Create new user
    const user = await User.create(req.body);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ id: user.id });

    // Store refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.status(201).json({
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    next(error);
  }
});

// Login user
router.post('/login', loginLimiter, validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.failedLoginAttempts >= 5) {
      const timeSinceLastAttempt = Date.now() - user.lastFailedLogin;
      if (timeSinceLastAttempt < 60 * 60 * 1000) { // 1 hour
        throw new AppError('Account locked. Please try again later', 401);
      }
      // Reset attempts if lockout period has passed
      user.failedLoginAttempts = 0;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.lastFailedLogin = new Date();
      await user.save();
      throw new AppError('Invalid credentials', 401);
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ id: user.id });

    // Store refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.json({
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    next(error);
  }
});

// Refresh token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, true);
    
    // Find user
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== refreshToken || user.refreshTokenExpires < new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({ id: user.id });

    // Update refresh token
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    next(error);
  }
});

// Request password reset
router.post('/forgot-password', resetPasswordLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (user) {
      const resetToken = generatePasswordResetToken(user.id);
      // TODO: Send email with reset link
      res.json({ message: 'Password reset email sent' });
    } else {
      res.json({ message: 'If an account exists with this email, a password reset link has been sent' });
    }
  } catch (error) {
    logger.error('Error requesting password reset:', error);
    next(error);
  }
});

// Reset password
router.post('/reset-password', resetPasswordLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const decoded = verifyToken(token, false, true); // true for reset token
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AppError('Invalid reset token', 400);
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Error resetting password:', error);
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