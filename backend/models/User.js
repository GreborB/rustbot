const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    steamId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    profileUrl: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Add instance methods
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    return user;
};

// Add static methods
userSchema.statics.findBySteamId = function(steamId) {
    return this.findOne({ steamId });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
