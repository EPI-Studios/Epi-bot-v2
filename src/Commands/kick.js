const Discord = require('discord.js')

module.exports = {

    name: "kick",
    description: "kick un membre",
    permission: Discord.PermissionFlagsBits.kickMembers,
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
            description: "La raison du kick",
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

        if(message.user.id === user.id) return message.reply("Vous ne pouvez pas vous kick vous-même.")
        if((await message.guild.fetchOwner()).id === user.id) return message.reply("Vous ne pouvez pas vous kick le propriétaire du serveur.")
        if(member && !member.kickable) return message.reply("Je ne peux pas kick ce membre car il est un administrateur et/ou modérateur.")
        if(member && message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply("Je ne peux pas kick ce membre car il est supérieur à moi.")

        try {await user.send(`Tu as été kick du server ${message.guild.name} pour la raison suivante : \`${reason}\``)} catch(err) {}

        await message.reply(`${message.user} a kick ${user.tag} pour la raison : \`${reason}\``)

        await member.kick(reason)
    }
}