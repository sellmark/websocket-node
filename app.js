const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const authController = require('./controllers/authController');
const { createWebSocketServer } = require('./services/webSocketService');
const { SESSION_SECRET } = require('./config/auth');

const app = express();
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins (adjust as needed)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware to set required headers for Cross Origin Isolation and SharedArrayBuffer
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// Serve static files from the public directory with appropriate headers
app.use(express.static('public'));

// Routes
app.get('/auth', authController.getIndex);
app.get('/auth/twitch', authController.getTwitchAuth);
app.get('/auth/twitch/callback', authController.getTwitchCallback);

// Load SSL certificates
const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
};

// Start HTTPS server
const server = https.createServer(options, app).listen(3000, () => {
    console.log('Server is listening on port 3000');
});

// Start HTTP server
const unsecureServer = http.createServer(app).listen(3001, () => {
    console.log('Server is listening on UNSECURE port 3001');
});

createWebSocketServer(server);
createWebSocketServer(unsecureServer);

// Refresh token periodically (e.g., every hour)
setInterval(() => {
    authController.refreshToken((err, data) => {
        if (err) {
            console.error('Failed to refresh token:', err);
        } else {
            console.log('Token refreshed:', data);
        }
    });
}, 3600000); // 1 hour in milliseconds