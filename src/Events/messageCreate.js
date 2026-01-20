const Discord = require('discord.js');

module.exports = async (bot, message) => {

    let prefix = '?';

    // 1. On vérifie d'abord si c'est le bon préfixe (pour éviter les calculs inutiles)
    if(!message.content.startsWith(prefix)) return;

    let messageArray = message.content.split(' ');
    let commandName = messageArray[0].slice(prefix.length);
    let args = messageArray.slice(1);

    // 2. On essaie de charger la commande
    try {
        // On essaie de trouver le fichier
        let command = require(`../Commands/${commandName}.js`);
        
        // 3. On l'exécute
        command.run(bot, message, args);
        
    } catch (err) {
        // Si l'erreur est "MODULE_NOT_FOUND", c'est juste que la commande n'existe pas.
        if (err.code === 'MODULE_NOT_FOUND') {
            return message.reply(`La commande ${commandName} n'existe pas !`);
        }
        // Sinon, c'est une vraie erreur dans le code, on l'affiche
        console.error(err);
    }
}