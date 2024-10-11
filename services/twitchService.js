const tmi = require('tmi.js');

let twitchClient;

const createTwitchClient = (accessToken, channels, broadcast) => {
    if (twitchClient) {
        twitchClient.disconnect();
    }

    twitchClient = new tmi.Client({
        options: { debug: true },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: 'gamescore-stream-pet', // Replace with your Twitch username
            password: `oauth:${accessToken}`
        },
        channels
    });

    twitchClient.connect();

    twitchClient.on('message', (channel, tags, message, self) => {
        if (self) return; // Ignore messages from the bot itself

        const commandPattern = /^!move\s+(R|L)(\d+)$/;
        const match = message.match(commandPattern);

        if (match) {
            const direction = match[1] === 'R' ? 'right' : 'left';
            const distance = parseInt(match[2], 10);
            const notification = {
                type: 'command',
                command: 'move',
                direction,
                distance
            };
            console.log(`[${new Date()}] Command received: Move ${direction} by ${distance}`);
            broadcast(JSON.stringify(notification));
        }
    });
};

module.exports = { createTwitchClient };