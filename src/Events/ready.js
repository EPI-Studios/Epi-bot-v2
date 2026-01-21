// Importation de la librairie Discord (Correction de 'DIscord' en 'Discord')
const Discord = require('discord.js');

// Importation du script qui charge les Slash Commands (commandes /)
const loadSlashCommands = require('../Loaders/loadSlashCommands');

// Exportation de la fonction principale
// Elle est 'async' car le chargement des commandes prend un peu de temps
module.exports = async (bot) => {

    // On attend (await) que les Slash Commands soient bien chargées dans l'API de Discord
    await loadSlashCommands(bot);

    // Une fois que tout est chargé, on affiche dans la console que le bot est en ligne
    console.log(`${bot.user.tag} is online!`);
}