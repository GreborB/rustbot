import express from 'express';
import { loginLimiter, apiLimiter } from '../middleware/rateLimit.js';
import { validate, schemas } from '../middleware/validator.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { User } from '../models/Index.js';
import { generateTokens } from '../utils/security.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Login route with rate limiting and validation
router.post('/login', loginLimiter, validate(schemas.login), async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!user.isActive) {
            throw new AppError('Account is deactivated', 401);
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokens = generateTokens({ id: user.id, role: user.role });

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                steamId: user.steamId,
                avatar: user.avatar
            },
            ...tokens
        });
    } catch (error) {
        next(error);
    }
});

// Register route with validation
router.post('/register', validate(schemas.register), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if username or email already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            throw new AppError('Username or email already exists', 400);
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            role: 'user'
        });

        // Generate tokens
        const tokens = generateTokens({ id: user.id, role: user.role });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            ...tokens
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, apiLimiter, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            steamId: req.user.steamId,
            avatar: req.user.avatar
        }
    });
});

// Update user profile
router.put('/me', authenticate, validate(schemas.updateUser), async (req, res, next) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = req.user;

        // If changing password, verify current password
        if (newPassword) {
            const isValidPassword = await user.comparePassword(currentPassword);
            if (!isValidPassword) {
                throw new AppError('Current password is incorrect', 400);
            }
            user.password = newPassword;
        }

        // Update other fields
        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// Steam authentication routes
router.get('/steam', authenticate, (req, res) => {
    const returnUrl = `${req.protocol}://${req.get('host')}/auth/steam/callback`;
    const authUrl = `https://steamcommunity.com/openid/login?openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.realm=${returnUrl}&openid.return_to=${returnUrl}`;
    res.redirect(authUrl);
});

router.get('/steam/callback', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const steamId = req.query['openid.identity'].split('/').pop();

        // Update user with Steam info
        user.steamId = steamId;
        await user.save();

        res.redirect('/dashboard');
    } catch (error) {
        next(error);
    }
});

// Get Steam user info
router.get('/steam/user/:steamId', async (req, res) => {
    try {
        const userInfo = await steamAuth.getUserInfo(req.params.steamId);
        res.json(userInfo);
    } catch (error) {
        logger.error('Get Steam user info error:', error);
        res.status(500).json({ error: 'Failed to get Steam user info' });
    }
});

// Get user's owned games
router.get('/steam/games/:steamId', async (req, res) => {
    try {
        const games = await steamAuth.getOwnedGames(req.params.steamId);
        res.json(games);
    } catch (error) {
        logger.error('Get owned games error:', error);
        res.status(500).json({ error: 'Failed to get owned games' });
    }
});

// Get player bans
router.get('/steam/bans/:steamId', async (req, res) => {
    try {
        const bans = await steamAuth.getPlayerBans(req.params.steamId);
        res.json(bans);
    } catch (error) {
        logger.error('Get player bans error:', error);
        res.status(500).json({ error: 'Failed to get player bans' });
    }
});

export default router; 