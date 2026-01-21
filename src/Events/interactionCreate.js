const Discord = require('discord.js');

module.exports = async (bot, interaction) => {

    // On vérifie si l'interaction est de type "ApplicationCommand" 
    // (C'est-à-dire une Slash Command comme /ping, et non un bouton ou un menu)
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {

        // --- RECUPERATION DE LA COMMANDE ---
        // On va chercher la commande dans la collection 'bot.commands' (la mémoire du bot)
        // en utilisant le nom tapé par l'utilisateur (interaction.commandName)
        let command = bot.commands.get(interaction.commandName);

        // Sécurité : Si jamais la commande n'est pas trouvée (ex: fichier supprimé mais encore visible sur Discord), on arrête.
        if (!command) return interaction.reply("Erreur : Cette commande semble introuvable.");

        // --- EXECUTION ---
        // On lance la fonction .run() qui se trouve dans ton fichier de commande (ex: ping.js ou ban.js)
        // On lui transmet :
        // 1. bot (pour avoir accès aux infos du bot)
        // 2. interaction (pour pouvoir répondre)
        // 3. interaction.options (les arguments : user, raison, etc.)
        try {
            await command.run(bot, interaction, interaction.options);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
        }
    }
}