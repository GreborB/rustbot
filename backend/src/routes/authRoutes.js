import express from 'express';
import { generateToken } from '../utils/security.js';
import steamAuth from '../services/steamAuth.js';
import { User } from '../models/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Steam authentication routes
router.get('/steam', async (req, res) => {
    try {
        const authUrl = await steamAuth.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        logger.error('Steam auth error:', error);
        res.status(500).json({ error: 'Failed to initiate Steam authentication' });
    }
});

router.get('/steam/callback', async (req, res) => {
    try {
        const steamUser = await steamAuth.verifyCallback(req.query);
        
        // Find or create user
        let user = await User.findOne({ where: { steamId: steamUser.steamId } });
        
        if (!user) {
            user = await User.create({
                username: steamUser.username,
                steamId: steamUser.steamId,
                avatar: steamUser.avatar,
                profileUrl: steamUser.profileUrl
            });
        } else {
            // Update user info
            await user.update({
                username: steamUser.username,
                avatar: steamUser.avatar,
                profileUrl: steamUser.profileUrl,
                lastLogin: new Date()
            });
        }

        // Generate JWT token
        const token = generateToken({ 
            id: user.id,
            username: user.username,
            steamId: user.steamId
        });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
        logger.error('Steam callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
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