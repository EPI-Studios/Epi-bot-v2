const Discord = require("discord.js")
const fs = require("fs") // Nécessaire pour lire le fichier logs.json

module.exports = {

    name: "kick",
    description: "Expulser un membre du serveur",
    permission: Discord.PermissionFlagsBits.KickMembers, // Correction de la majuscule ici
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Le membre à kick",
            required: true
        }, {
            type: "string",
            name: "raison",
            description: "La raison de l'expulsion",
            required: false // J'ai mis false pour que ce soit optionnel (plus fluide)
        }
    ],

    async run(bot, message, args) {

        try {
            let user = args.getUser("membre")
            if (!user) return message.reply("Pas de membre à kick !")
            
            let member = message.guild.members.cache.get(user.id)
            if (!member) return message.reply("Ce membre n'est pas sur le serveur !")

            let reason = args.getString("raison")
            if (!reason) reason = "Pas de raison fournie."

            // --- SECURITE ---
            if (message.user.id === user.id) return message.reply("Tu ne peux pas t'auto-kick !")
            if ((await message.guild.fetchOwner()).id === user.id) return message.reply("Impossible de kick le propriétaire !")
            if (!member.kickable) return message.reply("Je ne peux pas kick ce membre (Il est admin ou mon rôle est trop bas).")
            if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Tu es inférieur à ce membre, tu ne peux pas le kick.")

            // --- ACTION ---
            
            // 1. MP (Message Privé)
            try {
                await user.send(`Tu as été expulsé de ${message.guild.name} par ${message.user.tag} pour la raison : \`${reason}\``)
            } catch (err) {}

            // 2. Réponse chat
            await message.reply(`${message.user} a expulsé ${user.tag} pour la raison : \`${reason}\``)

            // 3. Kick réel
            await member.kick(reason)


            // --- SYSTÈME DE LOGS ---
            // Le bot va chercher si un salon logs est configuré
            try {
                let logsData = JSON.parse(fs.readFileSync("./logs.json", "utf8"))
                let logChannelId = logsData[message.guild.id]

                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId)
                    if (logChannel) {
                        // Création de la fiche (Embed)
                        let embed = new Discord.EmbedBuilder()
                            .setTitle("👢 Expulsion (KICK)")
                            .setColor("Orange") // Orange pour un kick
                            .setThumbnail(user.displayAvatarURL())
                            .addFields(
                                { name: "Membre expulsé", value: `${user.tag} (${user.id})`, inline: false },
                                { name: "Modérateur", value: `${message.user} (${message.user.id})`, inline: false },
                                { name: "Raison", value: reason, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: bot.user.username, iconURL: bot.user.displayAvatarURL() })

                        await logChannel.send({ embeds: [embed] })
                    }
                }
            } catch (err) {
                // Si le fichier logs n'existe pas ou erreur, on continue sans planter
            }

        } catch (err) {
            console.log(err)
            return message.reply("Une erreur est survenue lors du kick.")
        }
    }
}