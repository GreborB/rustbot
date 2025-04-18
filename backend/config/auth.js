const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.steamId);
});

passport.deserializeUser(async (steamId, done) => {
    try {
        const user = await User.findBySteamId(steamId);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new SteamStrategy({
    returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:3000/auth/steam/return',
    realm: process.env.STEAM_REALM || 'http://localhost:3000/',
    apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
    try {
        let user = await User.findBySteamId(profile.id);
        
        if (!user) {
            user = await User.create({
                steamId: profile.id,
                username: profile.displayName,
                avatar: profile.photos[0].value,
                profileUrl: profile._json.profileurl
            });
        } else {
            user.username = profile.displayName;
            user.avatar = profile.photos[0].value;
            user.profileUrl = profile._json.profileurl;
            user.lastLogin = new Date();
            await user.save();
        }
        
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

module.exports = passport; 