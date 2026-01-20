const Discord = require('discord.js')

module.exports = {

    name: "mute",
    description: "mute un membre",
    permission: Discord.PermissionFlagsBits.kickMembers,
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Le membre à mute",
            required: true
        }, {
            type: "string",
            name: "raison",
            description: "La raison du mute",
            required: true
        }
        {
            type: "string",
            name: "time",
            description: "durée du mute",
            required: true
        }
    ],

    async run(bot, message, args) {

        let user = args.getUser("membre")
        if(!user) return message.reply("Impossible de trouver ce membre.")
        let member = message.guild.members.cache.get(user.id)
        if(!member) return message.reply("Ce membre n'est pas dans le serveur.")

        let reason = args.getString("raison")
        if(!reason) reason = "Aucune raison fournie.";

        let timeString = args.getString("time")
        let duration = 0

        if (timeString.endsWith("s")){
            duration = parselnt(timeString)*1000
        }
        else if (timeString.endsWith("m")){
            duration = parselnt(timeString)*60*1000
        }
        else if (timeString.endsWith("h")){
            duration = parselnt(timeString)*60*60*1000
        }
        else if (timeString.endsWith("j")){
            duration = parselnt(timeString)*24*60*60*1000
        }


        if(message.user.id === user.id) return message.reply("Vous ne pouvez pas vous mute vous-même.")
        if((await message.guild.fetchOwner()).id === user.id) return message.reply("Vous ne pouvez pas vous mute le propriétaire du serveur.")
        if(member && !member.mutable) return message.reply("Je ne peux pas mute ce membre car il est un administrateur et/ou modérateur.")
        if(member && message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Je ne peux pas mute ce membre car il est supérieur à moi.")

        try {await user.send(`Tu as été mute du server ${message.guild.name} pour la raison suivante : \`${reason}\``)} catch(err) {}

        await message.reply(`${message.user} a mute ${user.tag} pour la raison : \`${reason}\``)

        await member.mute(reason)
    }
}