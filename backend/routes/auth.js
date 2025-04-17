const express = require('express');
const passport = require('../config/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Steam authentication routes
router.get('/steam', passport.authenticate('steam'));

router.get('/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/login' }),
    (req, res) => {
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: req.user.steamId,
                username: req.user.username,
                isAdmin: req.user.isAdmin
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
);

// Get current user
router.get('/me', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.user);
});

// Logout
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
});

module.exports = router;
