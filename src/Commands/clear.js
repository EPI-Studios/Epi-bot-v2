const Discord = require("discord.js")
const fs = require("fs")

module.exports = {

    name: "clear",
    description: "Gérer la suppression des messages",
    permission: Discord.PermissionFlagsBits.ManageMessages, // Permission de base
    dm: false,
    options: [
        {
            type: "sub_command",
            name: "quantite",
            description: "Supprimer un nombre précis de messages (Max 100)",
            options: [
                {
                    type: "integer",
                    name: "nombre",
                    description: "Nombre de messages à supprimer",
                    required: true,
                    minValue: 1,
                    maxValue: 100
                }
            ]
        },
        {
            type: "sub_command",
            name: "tout",
            description: "⚠️ Supprime TOUS les messages (Clone le salon)"
        }
    ],

    async run(bot, message, args) {

        // On récupère quelle sous-commande a été choisie (quantite ou tout)
        const subCommand = args.getSubcommand();

        try {

            // ===============================================
            // OPTION 1 : SUPPRIMER UNE QUANTITÉ (1-100)
            // ===============================================
            if (subCommand === 'quantite') {
                
                let amount = args.getInteger("nombre");

                // bulkDelete(amount, true) -> Le 'true' signifie qu'on ignore les messages vieux de +14 jours
                // (Discord interdit de supprimer en masse les messages trop vieux)
                const deleted = await message.channel.bulkDelete(amount, true);

                // Réponse éphémère (seul toi la voit)
                await message.reply({ content: `✅ J'ai supprimé **${deleted.size}** messages.`, ephemeral: true });

                // --- LOGS ---
                sendLog(bot, message, "Quantité", `**${deleted.size}** messages supprimés.`);
            }

            // ===============================================
            // OPTION 2 : TOUT SUPPRIMER (NUKE)
            // ===============================================
            else if (subCommand === 'tout') {

                // Vérification de sécurité supplémentaire
                // Il faut la permission "Gérer les salons" pour cloner
                if (!message.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                    return message.reply({ content: "Tu as besoin de la permission `Gérer les salons` pour utiliser cette option radicale.", ephemeral: true });
                }

                // On prévient que ça arrive
                await message.reply("💣 **Nettoyage intégral en cours...** Le salon va être recréé.");

                // 1. On clone le salon actuel (garde nom, permissions, position, catégorie)
                const newChannel = await message.channel.clone();

                // 2. On supprime l'ancien salon
                await message.channel.delete();

                // 3. On envoie un message dans le NOUVEAU salon
                const msg = await newChannel.send(` **Ce salon a été nettoyé intégralement par ${message.user}.**`);
                
                // (Optionnel) On supprime le message du bot après 5 secondes pour faire propre
                setTimeout(() => msg.delete().catch(() => {}), 5000);

                // --- LOGS ---
                // Attention : 'message.channel' n'existe plus, on doit utiliser l'ID du serveur pour retrouver le salon de logs
                sendLog(bot, message, "Total (Nuke)", `Le salon **#${newChannel.name}** a été entièrement réinitialisé.`, newChannel);
            }

        } catch (err) {
            console.log(err);
            // Si on a déjà répondu (cas du nuke), on ne fait rien, sinon on envoie l'erreur
            if (!message.replied) message.reply({ content: "Une erreur est survenue (Il est possible que les messages soient trop vieux pour être supprimés en masse).", ephemeral: true });
        }
    }
}

// ===============================================
// FONCTION EXTERNE POUR LES LOGS
// ===============================================
async function sendLog(bot, interaction, type, details, newChannelObj = null) {
    try {
        let logsData = JSON.parse(fs.readFileSync("./logs.json", "utf8"));
        let logChannelId = logsData[interaction.guild.id];

        if (logChannelId) {
            let logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                
                // Si on vient de faire un Nuke, interaction.channel est mort.
                // On utilise newChannelObj s'il est fourni, sinon le channel de l'interaction
                let channelName = newChannelObj ? newChannelObj.name : interaction.channel.name;

                let embed = new Discord.EmbedBuilder()
                    .setTitle("Suppression de Messages")
                    .setColor("Blue")
                    .addFields(
                        { name: "Modérateur", value: `${interaction.user}`, inline: true },
                        { name: "Type", value: type, inline: true },
                        { name: "Salon", value: `#${channelName}`, inline: true },
                        { name: "Détails", value: details, inline: false }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        }
    } catch (err) {
        // Ignore errors
    }
}