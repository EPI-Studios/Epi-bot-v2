const Discord = require('discord.js');

module.exports = {

    name: 'ping',
    description: 'Responds with Pong!',

    async run(bot, message,) {

        return message.channel.send('Pong!');
    }
};
