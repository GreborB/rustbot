import { verifyToken } from '../utils/security.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/Index.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AppError('Invalid token format', 401);
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            throw new AppError('Invalid token', 401);
        }

        // Get user from database
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new AppError('User not found', 401);
        }

        if (!user.isActive) {
            return next(new AppError('User account is deactivated', 401));
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        next(new AppError('Not authorized to access this route', 401));
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Not authorized to access this route', 403));
        }
        next();
    };
}; 