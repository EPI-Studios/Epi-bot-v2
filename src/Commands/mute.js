const Discord = require("discord.js")
const fs = require("fs") // Nécessaire pour lire logs.json

module.exports = {

    name: "mute",
    description: "Mute un membre temporairement (Timeout)",
    permission: Discord.PermissionFlagsBits.ModerateMembers,
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Le membre à mute",
            required: true
        }, {
            type: "string",
            name: "temps",
            description: "La durée du mute (ex: 1m, 1h, 1j)",
            required: true
        }, {
            type: "string",
            name: "raison",
            description: "La raison du mute",
            required: false 
        }
    ],

    async run(bot, message, args) {

        try {
            let user = args.getUser("membre")
            if (!user) return message.reply("Pas de membre à mute !")
            
            let member = message.guild.members.cache.get(user.id)
            if (!member) return message.reply("Ce membre n'est pas sur le serveur !")

            let reason = args.getString("raison")
            if (!reason) reason = "Pas de raison fournie."

            // --- CALCUL DU TEMPS ---
            let time = args.getString("temps")
            let duration = 0

            if (time.endsWith("s")) { duration = parseInt(time) * 1000 }
            else if (time.endsWith("m")) { duration = parseInt(time) * 60 * 1000 }
            else if (time.endsWith("h")) { duration = parseInt(time) * 60 * 60 * 1000 }
            else if (time.endsWith("j") || time.endsWith("d")) { duration = parseInt(time) * 24 * 60 * 60 * 1000 }
            else { return message.reply("Format de temps invalide ! (s, m, h, j)") }

            if (duration < 5000 || duration > 2.419e+9) return message.reply("Le mute doit durer entre 5 secondes et 28 jours !")

            // --- SECURITE ---
            if (message.user.id === user.id) return message.reply("Tu ne peux pas te mute toi-même !")
            if ((await message.guild.fetchOwner()).id === user.id) return message.reply("Impossible de mute le propriétaire du serveur !")
            if (!member.moderatable) return message.reply("Je ne peux pas mute ce membre !")
            if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Tu ne peux pas mute ce membre car il est supérieur à toi.")
            if (member.isCommunicationDisabled()) return message.reply("Ce membre est déjà mute !")

            // --- ACTION ---

            try { await user.send(`Tu as été mute du serveur ${message.guild.name} pendant ${time} par ${message.user.tag} pour la raison : \`${reason}\``) } catch (err) {}

            await message.reply(`${message.user} a mute ${user.tag} pendant ${time} pour la raison : \`${reason}\``)

            await member.timeout(duration, reason)

            // --- SYSTEME DE LOGS ---
            try {
                let logsData = JSON.parse(fs.readFileSync("./logs.json", "utf8"))
                let logChannelId = logsData[message.guild.id]

                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId)
                    if (logChannel) {
                        let embed = new Discord.EmbedBuilder()
                            .setTitle("🤐 Exclusion temporaire (MUTE)")
                            .setColor("Yellow") // JAUNE pour le mute
                            .setThumbnail(user.displayAvatarURL())
                            .addFields(
                                { name: "Membre mute", value: `${user.tag} (${user.id})`, inline: false },
                                { name: "Modérateur", value: `${message.user} (${message.user.id})`, inline: false },
                                { name: "Durée", value: time, inline: true }, // Ajout du champ Durée
                                { name: "Raison", value: reason, inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: bot.user.username, iconURL: bot.user.displayAvatarURL() })

                        await logChannel.send({ embeds: [embed] })
                    }
                }
            } catch (err) {
                // On ignore les erreurs de logs
            }

        } catch (err) {
            console.log(err)
            return message.reply("Une erreur est survenue lors du mute.")
        }
    }
}