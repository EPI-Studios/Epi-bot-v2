const Discord = require("discord.js")

module.exports = {

    name: "mute",
    description: "Mute un membre temporairement",
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

            let time = args.getString("temps")
            let duration = 0

            if (time.endsWith("s")) { duration = parseInt(time) * 1000 }
            else if (time.endsWith("m")) { duration = parseInt(time) * 60 * 1000 }
            else if (time.endsWith("h")) { duration = parseInt(time) * 60 * 60 * 1000 }
            else if (time.endsWith("j") || time.endsWith("d")) { duration = parseInt(time) * 24 * 60 * 60 * 1000 }
            else { return message.reply("Format de temps invalide ! (s, m, h, j)") }

            if (duration < 5000 || duration > 2.419e+9) return message.reply("Le mute doit durer entre 5 secondes et 28 jours !")

            if (message.user.id === user.id) return message.reply("Tu ne peux pas te mute toi-même !")
            if ((await message.guild.fetchOwner()).id === user.id) return message.reply("Impossible de mute le propriétaire du serveur !")
            if (!member.moderatable) return message.reply("Je ne peux pas mute ce membre !")
            if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Tu ne peux pas mute ce membre car il est supérieur à toi.")
            if (member.isCommunicationDisabled()) return message.reply("Ce membre est déjà mute !")

            try { await user.send(`Tu as été mute du serveur ${message.guild.name} pendant ${time} pour la raison : \`${reason}\``) } catch (err) {}

            await message.reply(`${message.user} a mute ${user.tag} pendant ${time} pour la raison : \`${reason}\``)

            await member.timeout(duration, reason)

        } catch (err) {
            return message.reply("Une erreur est survenue lors du mute.")
        }
    }
}