module.exports = {

    name: 'ping',
    description: 'Responds with Pong!',
    permission:"Aucune",
    dm: true,
    Options: [],

    async run(bot, message, args) {

        return message.channel.send('Pong!');
    }
};
