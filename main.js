// Charge les variables d'environnement (si tu as un fichier .env)
require('dotenv').config();

// Importe la librairie discord.js
const Discord = require('discord.js');

// Définit les permissions du bot.
// Le code 3276799 correspond à "ALL INTENTS" (toutes les permissions activées).
const intents = new Discord.IntentsBitField(3276799);

// Importe ton fichier de configuration (où se trouve le token)
const config = require('./src/config');

// Importe tes scripts qui chargent les commandes et les événements
const LoadCommands = require('./src/Loaders/LoadCommands');
const LoadEvents = require('./src/Loaders/LoadEvents');

// Crée le bot avec les permissions définies plus haut
const bot = new Discord.Client({intents});

// Crée une "Collection" vide pour stocker les commandes du bot en mémoire
bot.commands = new Discord.Collection();

// Connecte le bot à Discord via le token
bot.login(config.token);

// Lance le chargement des commandes et des événements
LoadCommands(bot);
LoadEvents(bot);