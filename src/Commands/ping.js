module.exports = {

    name: 'ping',
    description: 'Responds with Pong!',

    async run(bot, message, args) {

        return message.channel.send('Pong!');
    }
};
