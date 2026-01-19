require('dotenv').config();

const Discord = require('discord.js');
const {Client,GatewayIntentBits} = require('discord.js');
const intents = new Discord.IntentsBitField(3276799)
const { token } = require('./src/config');
const LoadCommands = require('./src/Loaders/LoadCommands');
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

bot.on('messageCreate', async message => {

    if(message.content === '!ping') return  bot.commands.get('ping').run(bot, message);
})




client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.login(token);
