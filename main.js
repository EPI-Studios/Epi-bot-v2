require('dotenv').config();

const {Client,GatewayIntentBits} = require('discord.js');
const { token } = require('./src/config');



const client = new Client({
     intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] }); 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Event.MessageContent, message => {

    if(message.author.bot) return;

    if (message.content === '!ping') {
        message.channel.send('pong');
    }
});


client.login(token);