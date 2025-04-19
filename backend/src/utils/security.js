import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { logger } from './logger.js';

/**
 * Hash a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} Whether the passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a JWT token
 * @param {Object} payload - The data to encode in the token
 * @returns {string} The generated JWT token
 */
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify a JWT token
 * @param {string} token - The token to verify
 * @returns {Object} The decoded token payload
 */
export const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.resetSecret,
    { expiresIn: '1h' }
  );
};

export const verifyPasswordResetToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.resetSecret);
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
}; 