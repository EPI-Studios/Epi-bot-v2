const Discord = require("discord.js")
const fs = require("fs")

module.exports = {

    name: "warn",
    description: "Avertir un membre (Ban automatique au 3ème warn)",
    permission: Discord.PermissionFlagsBits.BanMembers, 
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Le membre à avertir",
            required: true
        }, {
            type: "string",
            name: "raison",
            description: "La raison de l'avertissement",
            required: false 
        }
    ],

    async run(bot, message, args) {

        try {
            let user = args.getUser("membre")
            if (!user) return message.reply("Pas de membre à warn !")
            let member = message.guild.members.cache.get(user.id)
            if (!member) return message.reply("Ce membre n'est pas sur le serveur !")

            let reason = args.getString("raison")
            if (!reason) reason = "Pas de raison fournie."

            // --- VERIFICATIONS ---
            if (message.user.id === user.id) return message.reply("Tu ne peux pas te warn toi-même !")
            if ((await message.guild.fetchOwner()).id === user.id) return message.reply("Impossible de warn le propriétaire !")
            if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Tu ne peux pas warn ce membre car il est supérieur à toi.")
            if (!member.bannable) return message.reply("Je ne peux pas sanctionner ce membre (rôle trop élevé).")

            // --- GESTION DES WARNS (JSON) ---
            let warns = {}
            try {
                warns = JSON.parse(fs.readFileSync("./warns.json", "utf8"))
            } catch (err) {
                // Si le fichier n'existe pas, on continue
            }

            if (!warns[user.id]) warns[user.id] = 0
            warns[user.id]++

            // --- VARIABLES POUR LE LOG ---
            // On prépare les infos pour le log (Titre et Couleur changeront selon si c'est un ban ou non)
            let embedTitle = ""
            let embedColor = ""
            let embedDescription = ""

            // --- LOGIQUE WARN / BAN ---
            
            if (warns[user.id] >= 3) {
                
                // === CAS 3 : AUTO BAN ===
                embedTitle = "🚫 Auto-Ban (3 Warns)"
                embedColor = "Red"
                embedDescription = `**3ème avertissement atteint.**\nDernière raison : ${reason}`
                
                try {
                    await user.send(`Tu as atteint 3 avertissements sur ${message.guild.name}. Tu es donc banni définitivement. Dernière raison : \`${reason}\``)
                } catch (err) {}

                await message.reply(`${message.user} a warn ${user.tag}. \n**C'est son 3ème avertissement !** Le membre a été automatiquement banni.`)
                
                await member.ban({ reason: `Auto-ban: 3 avertissements atteints. Dernier warn: ${reason}` })

                delete warns[user.id] // On remet à zéro après le ban

            } else {

                // === CAS 1 ou 2 : SIMPLE WARN ===
                embedTitle = "⚠️ Avertissement (WARN)"
                embedColor = "Gold"
                embedDescription = `Raison : ${reason}\nNombre d'avertissements : **${warns[user.id]}/3**`

                try {
                    await user.send(`Tu as reçu un avertissement sur ${message.guild.name} pour la raison : \`${reason}\`\nAttention : au 3ème avertissement, c'est le ban automatique. (Actuel : ${warns[user.id]}/3)`)
                } catch (err) {}

                await message.reply(`${message.user} a warn ${user.tag} pour la raison : \`${reason}\`\nNombre d'avertissements : **${warns[user.id]}/3**`)
            }

            // --- SAUVEGARDE JSON ---
            fs.writeFileSync("./warns.json", JSON.stringify(warns, null, 4))


            // --- ENVOI DU LOG ---
            try {
                let logsData = JSON.parse(fs.readFileSync("./logs.json", "utf8"))
                let logChannelId = logsData[message.guild.id]

                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId)
                    if (logChannel) {
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(embedTitle)
                            .setColor(embedColor)
                            .setThumbnail(user.displayAvatarURL())
                            .addFields(
                                { name: "Membre", value: `${user.tag} (${user.id})`, inline: false },
                                { name: "Modérateur", value: `${message.user} (${message.user.id})`, inline: false },
                                { name: "Détails", value: embedDescription, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: bot.user.username, iconURL: bot.user.displayAvatarURL() })

                        await logChannel.send({ embeds: [embed] })
                    }
                }
            } catch (err) {
                // Ignore si erreur de logs
            }

        } catch (err) {
            console.log(err)
            return message.reply("Une erreur est survenue lors du warn.")
        }
    }
}