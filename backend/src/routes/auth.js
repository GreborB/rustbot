import express from 'express';
import session from 'express-session';
import config from '../config.js';

const router = express.Router();

// Check if bot is paired
router.get('/status', (req, res) => {
    res.json({ 
        authenticated: req.session.rustConnected || false,
        status: req.session.rustStatus || 'disconnected'
    });
});

// Logout route (unpair bot)
router.get('/logout', (req, res) => {
    req.session.rustConnected = false;
    req.session.rustStatus = 'disconnected';
    res.redirect('/');
});

export default router; 