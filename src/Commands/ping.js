// Importation du module discord.js nécessaire pour interagir avec l'API
const Discord = require("discord.js")

module.exports = {

    // Le nom de la commande (ce que l'utilisateur tape : /ping)
    name: 'ping',
    
    // La description qui apparaît dans la liste des commandes Discord
    description: 'Affiche la latence du bot',
    
    // "Aucune" signifie ici que tout le monde peut l'utiliser (pas besoin d'être admin)
    permission: "Aucune", 
    
    // dm: true autorise l'utilisation de la commande en Message Privé (MP)
    dm: true, 
    
    // Le tableau des options est vide car /ping n'a pas besoin d'arguments (ex: pas de membre à mentionner)
    options: [], 

    // La fonction principale qui s'exécute quand on lance la commande
    async run(bot, message, args) {

        // Envoie une réponse (reply) visible par tout le monde
        // bot.ws.ping récupère la latence (le lag) en millisecondes entre le Bot et les serveurs Discord
        await message.reply(`Pong ! \nLatence : \`${bot.ws.ping}ms\``);
    }
};