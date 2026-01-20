require('dotenv').config();

const Discord = require('discord.js');
const {Client,GatewayIntentBits} = require('discord.js');
const intents = new Discord.IntentsBitField(3276799)
const { token } = require('./src/config');
const LoadCommands = require('./src/Loaders/LoadCommands');
const LoadEvents = require('./src/Loaders/LoadEvents');
const client = new Client({
     intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] }); 
const bot = new Discord.Client({intents});
const config = require('./src/config');

bot.commands = new Discord.Collection();
bot.login(config.token);
LoadCommands(bot);
LoadEvents(bot);
