const Discord = require("discord.js")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const fs = require("fs")

module.exports = {

    name: "ag",
    description: "Système de vote pour Assemblée Générale",
    permission: Discord.PermissionFlagsBits.Administrator, // Seuls les admins peuvent lancer un vote
    dm: false,
    options: [
        {
            type: "sub_command",
            name: "demarrer",
            description: "Lancer un nouveau vote",
            options: [
                {
                    type: "string",
                    name: "sujet",
                    description: "Le sujet du vote",
                    required: true
                }
            ]
        },
        {
            type: "sub_command",
            name: "arreter",
            description: "Clôturer un vote et voir les résultats",
            options: [
                {
                    type: "string",
                    name: "id_message",
                    description: "L'ID du message du vote (Clic droit sur le message -> Copier l'identifiant)",
                    required: true
                }
            ]
        }
    ],

    async run(bot, message, args) {
        
        const subCommand = args.getSubcommand();
        const votesFile = "./votes.json";

        // --- CHARGEMENT DE LA BASE DE DONNÉES ---
        let votesDB = {};
        try {
            if (fs.existsSync(votesFile)) {
                votesDB = JSON.parse(fs.readFileSync(votesFile, "utf8"));
            }
        } catch (err) {}


        // ==============================================
        // 🟢 DÉMARRER UN VOTE
        // ==============================================
        if (subCommand === "demarrer") {
            
            let sujet = args.getString("sujet");

            const embed = new Discord.EmbedBuilder()
                .setTitle("🗳️ Vote d'Assemblée Générale")
                .setDescription(`**Sujet :**\n${sujet}\n\n*Cliquez sur un bouton ci-dessous pour voter.*`)
                .setColor("Blue")
                .setFooter({ text: "Vote en cours..." })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('vote_pour').setLabel('Pour').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId('vote_contre').setLabel('Contre').setStyle(ButtonStyle.Danger).setEmoji('⛔'),
                new ButtonBuilder().setCustomId('vote_neutre').setLabel('Ne se prononce pas').setStyle(ButtonStyle.Secondary).setEmoji('😶')
            );

            // On envoie le message
            const msg = await message.reply({ embeds: [embed], components: [row], fetchReply: true });

            // On enregistre le vote dans le fichier JSON
            votesDB[msg.id] = {
                sujet: sujet,
                author: message.user.id,
                channel: message.channel.id,
                date: Date.now(),
                votes: {} // Ici on stockera "ID_USER": "CHOIX"
            };

            fs.writeFileSync(votesFile, JSON.stringify(votesDB, null, 4));
        }

        // ==============================================
        // 🔴 ARRÊTER UN VOTE
        // ==============================================
        else if (subCommand === "arreter") {

            let msgId = args.getString("id_message");

            // Vérifier si ce vote existe
            if (!votesDB[msgId]) return message.reply("Ce vote n'existe pas ou est déjà clôturé.");

            let voteData = votesDB[msgId];
            let results = voteData.votes; // Format: { "ID_USER": "pour", "ID_USER2": "contre" }

            // --- CALCUL DES RÉSULTATS ---
            let listPour = [];
            let listContre = [];
            let listNeutre = [];

            for (let [userId, choix] of Object.entries(results)) {
                // On essaie de retrouver le pseudo, sinon on met l'ID
                let member = message.guild.members.cache.get(userId);
                let name = member ? member.user.tag : userId;

                if (choix === "pour") listPour.push(name);
                else if (choix === "contre") listContre.push(name);
                else listNeutre.push(name);
            }

            // --- CRÉATION DU RAPPORT LOGS ---
            let logEmbed = new Discord.EmbedBuilder()
                .setTitle("📊 Résultats du Vote (Nominatif)")
                .setDescription(`**Sujet :** ${voteData.sujet}`)
                .setColor("Gold")
                .addFields(
                    { name: `✅ POUR (${listPour.length})`, value: listPour.length ? listPour.join("\n") : "Personne", inline: true },
                    { name: `⛔ CONTRE (${listContre.length})`, value: listContre.length ? listContre.join("\n") : "Personne", inline: true },
                    { name: `😶 NEUTRE (${listNeutre.length})`, value: listNeutre.length ? listNeutre.join("\n") : "Personne", inline: true }
                )
                .setTimestamp();

            // --- ENVOI DANS LE SALON LOGS ---
            try {
                let logsConfig = JSON.parse(fs.readFileSync("./logs.json", "utf8"));
                let logChannelId = logsConfig[message.guild.id];
                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) await logChannel.send({ embeds: [logEmbed] });
                } else {
                    await message.channel.send("⚠️ Pas de salon logs configuré, voici le résultat ici :", { embeds: [logEmbed] });
                }
            } catch (err) {
                // Si pas de logs.json, on envoie dans le channel actuel
                await message.reply({ content: "Voici les résultats :", embeds: [logEmbed] });
            }

            // --- MODIFICATION DU MESSAGE ORIGINAL ---
            try {
                // On essaie de retrouver le message du vote
                let voteChannel = message.guild.channels.cache.get(voteData.channel);
                if (voteChannel) {
                    let voteMsg = await voteChannel.messages.fetch(msgId);
                    if (voteMsg) {
                        let closedEmbed = new Discord.EmbedBuilder(voteMsg.embeds[0].data)
                            .setColor("Grey")
                            .setFooter({ text: "❌ Ce vote est clôturé." });

                        // On enlève les boutons (components: [])
                        await voteMsg.edit({ embeds: [closedEmbed], components: [] });
                    }
                }
            } catch (e) {}

            // --- NETTOYAGE ---
            delete votesDB[msgId];
            fs.writeFileSync(votesFile, JSON.stringify(votesDB, null, 4));

            await message.reply("✅ Le vote a été clôturé et les résultats envoyés dans les logs.");
        }
    }
}