const Discord = require("discord.js")
const fs = require("fs") // Nécessaire pour les logs

module.exports = {

    name: "ban",
    description: "Bannir définitivement un membre",
    permission: Discord.PermissionFlagsBits.BanMembers,
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Le membre à bannir",
            required: true
        }, {
            type: "string",
            name: "raison",
            description: "La raison du bannissement",
            required: false 
        }
    ],

    async run(bot, message, args) {

        try {
            // Méthode propre pour récupérer l'utilisateur
            let user = args.getUser("membre")
            if (!user) return message.reply("Pas de membre à bannir !")
            
            // On essaie de voir si le membre est sur le serveur (pour les vérifs de rôle)
            let member = message.guild.members.cache.get(user.id)

            let reason = args.getString("raison")
            if (!reason) reason = "Pas de raison fournie."

            // --- VÉRIFICATIONS DE SÉCURITÉ ---

            if (message.user.id === user.id) return message.reply("Tu ne peux pas te bannir toi-même !")
            if ((await message.guild.fetchOwner()).id === user.id) return message.reply("Ne ban pas le propriétaire du serveur !")
            
            // Vérification si déjà banni
            // On fetch les bans du serveur pour voir si l'ID est dedans
            const bans = await message.guild.bans.fetch();
            if (bans.has(user.id)) return message.reply("Ce membre est déjà banni !")

            // Si le membre est présent sur le serveur, on vérifie la hiérarchie
            if (member) {
                if (!member.bannable) return message.reply("Je ne peux pas bannir ce membre (Rôle trop élevé ou je n'ai pas la permission) !")
                if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Tu ne peux pas bannir ce membre car il est supérieur ou égal à toi !")
            }

            // --- EXÉCUTION ---

            // 1. Envoi du MP
            try {
                await user.send(`Tu as été banni du serveur ${message.guild.name} par ${message.user.tag} pour la raison : \`${reason}\``)
            } catch (err) {}

            // 2. Réponse dans le chat
            await message.reply(`${message.user} a banni ${user.tag} pour la raison : \`${reason}\``)

            // 3. Action de Ban
            // deleteMessageSeconds: 604800 supprime les messages des 7 derniers jours (optionnel, tu peux l'enlever)
            await message.guild.members.ban(user.id, { reason: reason })

            // --- SYSTÈME DE LOGS ---
            try {
                let logsData = JSON.parse(fs.readFileSync("./logs.json", "utf8"))
                let logChannelId = logsData[message.guild.id]

                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId)
                    if (logChannel) {
                        let embed = new Discord.EmbedBuilder()
                            .setTitle("🔨 Bannissement (BAN)")
                            .setColor("Red") // ROUGE pour le ban
                            .setThumbnail(user.displayAvatarURL())
                            .addFields(
                                { name: "Membre banni", value: `${user.tag} (${user.id})`, inline: false },
                                { name: "Modérateur", value: `${message.user} (${message.user.id})`, inline: false },
                                { name: "Raison", value: reason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: bot.user.username, iconURL: bot.user.displayAvatarURL() })

                        await logChannel.send({ embeds: [embed] })
                    }
                }
            } catch (err) {
                // Ignore si pas de logs configurés
            }

        } catch (err) {
            console.log(err)
            return message.reply("Une erreur est survenue lors du ban.")
        }
    }
}