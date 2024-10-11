const request = require('request');
const { TWITCH_CLIENT_ID, TWITCH_SECRET, CALLBACK_URL } = require('../config/auth');
const { createTwitchClient } = require('../services/twitchService');
const { broadcast } = require('../services/webSocketService');

let accessToken;
let refreshToken;

const authController = {
    getIndex: (req, res) => {
        res.send('<html><head><title>Twitch Auth</title></head><body><a href="/auth/twitch">Authenticate with Twitch</a></body></html>');
    },

    getTwitchAuth: (req, res) => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${CALLBACK_URL}&response_type=code&scope=chat:read+chat:edit`;
        res.redirect(authUrl);
    },

    getTwitchCallback: (req, res) => {
        const code = req.query.code;
        const options = {
            url: 'https://id.twitch.tv/oauth2/token',
            method: 'POST',
            json: true,
            body: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: CALLBACK_URL
            }
        };

        request(options, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                res.status(500).send('Failed to authenticate with Twitch');
                return;
            }

            accessToken = body.access_token;
            refreshToken = body.refresh_token;

            createTwitchClient(accessToken, ['gamescore_'], broadcast);
            res.send('Authenticated successfully');
        });
    },

    refreshToken: (callback) => {
        const options = {
            url: 'https://id.twitch.tv/oauth2/token',
            method: 'POST',
            json: true,
            body: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_SECRET
            }
        };

        request(options, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                callback(new Error('Failed to refresh token'), null);
                return;
            }

            accessToken = body.access_token;
            refreshToken = body.refresh_token;

            createTwitchClient(accessToken, ['gamescore_'], broadcast);
            callback(null, body);
        });
    }
};

module.exports = authController;