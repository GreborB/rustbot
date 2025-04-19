import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

class SteamAuthService {
    constructor() {
        this.steamApiKey = process.env.STEAM_API_KEY;
        this.returnUrl = `${config.server.baseUrl}/auth/steam/callback`;
    }

    async getAuthUrl() {
        const params = new URLSearchParams({
            'openid.ns': 'http://specs.openid.net/auth/2.0',
            'openid.mode': 'checkid_setup',
            'openid.return_to': this.returnUrl,
            'openid.realm': config.server.baseUrl,
            'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
        });

        return `https://steamcommunity.com/openid/login?${params.toString()}`;
    }

    async verifyCallback(query) {
        try {
            // Verify the OpenID response
            const params = new URLSearchParams({
                'openid.ns': 'http://specs.openid.net/auth/2.0',
                'openid.mode': 'check_authentication',
                ...query
            });

            const response = await axios.post('https://steamcommunity.com/openid/login', params);
            const isValid = response.data.includes('is_valid:true');

            if (!isValid) {
                throw new Error('Invalid Steam authentication');
            }

            // Extract Steam ID from the claimed_id
            const claimedId = query['openid.claimed_id'];
            const steamId = claimedId.match(/\d+$/)[0];

            // Get user info from Steam API
            const userInfo = await this.getUserInfo(steamId);
            return {
                steamId,
                ...userInfo
            };
        } catch (error) {
            logger.error('Steam authentication error:', error);
            throw error;
        }
    }

    async getUserInfo(steamId) {
        try {
            const response = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
                params: {
                    key: this.steamApiKey,
                    steamids: steamId
                }
            });

            const player = response.data.response.players[0];
            return {
                username: player.personaname,
                avatar: player.avatarfull,
                profileUrl: player.profileurl,
                lastLogoff: player.lastlogoff,
                timeCreated: player.timecreated
            };
        } catch (error) {
            logger.error('Failed to get Steam user info:', error);
            throw error;
        }
    }

    async getOwnedGames(steamId) {
        try {
            const response = await axios.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
                params: {
                    key: this.steamApiKey,
                    steamid: steamId,
                    include_appinfo: true,
                    include_played_free_games: true
                }
            });

            return response.data.response.games || [];
        } catch (error) {
            logger.error('Failed to get owned games:', error);
            throw error;
        }
    }

    async getPlayerBans(steamId) {
        try {
            const response = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/', {
                params: {
                    key: this.steamApiKey,
                    steamids: steamId
                }
            });

            return response.data.players[0];
        } catch (error) {
            logger.error('Failed to get player bans:', error);
            throw error;
        }
    }
}

export default new SteamAuthService(); 