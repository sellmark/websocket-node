const WebSocket = require('ws');

let wss;

const createWebSocketServer = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('A new client connected');

        ws.on('message', (message) => {
            console.log(`Received message from client: ${message}`);
            // Handle incoming messages from WebSocket clients if needed
        });

        ws.on('close', () => {
            console.log('A client disconnected');
        });
    });
};

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

module.exports = { createWebSocketServer, broadcast };