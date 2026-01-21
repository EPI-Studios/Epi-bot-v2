const Discord = require('discord.js');
const fs = require('fs');

module.exports = async (bot, interaction) => {

    // ==================================================
    // PARTIE 1 : GESTION DES SLASH COMMANDS (/ag, /ban...)
    // ==================================================
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {
        
        let command = bot.commands.get(interaction.commandName);
        if (!command) return interaction.reply("Erreur : Commande introuvable.");

        try {
            await command.run(bot, interaction, interaction.options);
        } catch (error) {
            console.error(error);
        }
    }

    // ==================================================
    // PARTIE 2 : GESTION DES BOUTONS DE VOTE
    // ==================================================
    else if (interaction.isButton()) {

        // On vérifie si c'est un bouton de vote (commence par "vote_")
        if (interaction.customId.startsWith("vote_")) {

            const votesFile = "./votes.json";
            let votesDB = {};

            try {
                if (fs.existsSync(votesFile)) votesDB = JSON.parse(fs.readFileSync(votesFile, "utf8"));
            } catch (err) { return; }

            // On récupère l'ID du message sur lequel le bouton est cliqué
            let msgId = interaction.message.id;

            // Si ce message n'est pas dans la base de données, c'est que le vote est fini
            if (!votesDB[msgId]) {
                return interaction.reply({ content: "❌ Ce vote est terminé ou n'existe plus.", ephemeral: true });
            }

            // On détermine le choix selon l'ID du bouton
            let choix = "";
            if (interaction.customId === "vote_pour") choix = "pour";
            else if (interaction.customId === "vote_contre") choix = "contre";
            else if (interaction.customId === "vote_neutre") choix = "neutre";

            // On enregistre le vote de l'utilisateur
            votesDB[msgId].votes[interaction.user.id] = choix;

            // On sauvegarde
            fs.writeFileSync(votesFile, JSON.stringify(votesDB, null, 4));

            // On confirme à l'utilisateur (Ephemeral = seul lui le voit)
            await interaction.reply({ content: `✅ Votre vote **${choix.toUpperCase()}** a bien été pris en compte. (Vous pouvez changer d'avis en cliquant sur un autre bouton)`, ephemeral: true });
        }
    }
}