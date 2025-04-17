import express from 'express';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import config from '../config.js';

const router = express.Router();

// Configure Steam Strategy
passport.use(new SteamStrategy({
    returnURL: `${config.BASE_URL}/api/auth/steam/return`,
    realm: config.BASE_URL,
    apiKey: config.STEAM_API_KEY
}, (identifier, profile, done) => {
    // Store the Steam profile in the session
    return done(null, profile);
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Steam authentication routes
router.get('/steam', passport.authenticate('steam'));

router.get('/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

// Check authentication status
router.get('/status', (req, res) => {
    res.json({ 
        authenticated: req.isAuthenticated(),
        user: req.user,
        rustConnected: req.session.rustConnected || false,
        status: req.session.rustStatus || 'disconnected'
    });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.session.rustConnected = false;
    req.session.rustStatus = 'disconnected';
    res.redirect('/');
});

export default router; 