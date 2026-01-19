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

client.login(token)