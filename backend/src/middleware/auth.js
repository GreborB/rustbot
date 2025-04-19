import { verifyToken, generateTokens } from '../utils/security.js';
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
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Check for refresh token
                const refreshToken = req.headers['x-refresh-token'];
                if (!refreshToken) {
                    throw new AppError('Token expired. Please login again.', 401);
                }

                // Verify refresh token
                try {
                    const refreshDecoded = verifyToken(refreshToken, true);
                    const user = await User.findByPk(refreshDecoded.id);
                    
                    if (!user || user.refreshToken !== refreshToken) {
                        throw new AppError('Invalid refresh token', 401);
                    }

                    // Generate new tokens
                    const { accessToken, refreshToken: newRefreshToken } = generateTokens({ 
                        id: user.id,
                        role: user.role 
                    });

                    // Update refresh token in database
                    user.refreshToken = newRefreshToken;
                    await user.save();

                    // Set new tokens in response headers
                    res.setHeader('x-access-token', accessToken);
                    res.setHeader('x-refresh-token', newRefreshToken);

                    decoded = refreshDecoded;
                } catch (refreshError) {
                    throw new AppError('Session expired. Please login again.', 401);
                }
            } else {
                throw new AppError('Invalid token', 401);
            }
        }

        // Get user from database
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new AppError('User not found', 401);
        }

        if (!user.isActive) {
            throw new AppError('User account is deactivated', 401);
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        next(error);
    }
};

// Role-based authorization middleware
export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Not authenticated', 401));
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return next(new AppError('Not authorized to access this resource', 403));
        }

        next();
    };
}; 