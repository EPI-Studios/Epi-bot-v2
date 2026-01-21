const Discord = require("discord.js");
const fs = require("fs");

module.exports = {

    name: "rank",
    description: "Afficher votre niveau et votre XP",
    permission: "Aucune",
    dm: false,
    options: [
        {
            type: "user",
            name: "membre",
            description: "Voir le niveau d'un autre membre",
            required: false
        }
    ],

    async run(bot, message, args) {

        // On détermine qui on regarde (soi-même ou un autre)
        let user = args.getUser("membre") || message.user;
        let id = user.id;

        // Lecture de la DB
        let db = {};
        try {
            db = JSON.parse(fs.readFileSync("./levels.json", "utf8"));
        } catch (err) {}

        // Si le membre n'a pas encore parlé
        if (!db[id]) {
            return message.reply("Ce membre n'a pas encore d'XP !");
        }

        let level = db[id].level;
        let xp = db[id].xp;
        let xpNeeded = level * 100; // La même formule que dans messageCreate.js

        // Création de la carte de niveau (Embed)
        let embed = new Discord.EmbedBuilder()
            .setColor("Blue")
            .setTitle(`Niveau de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Niveau", value: `🏆 ${level}`, inline: true },
                { name: "XP Actuel", value: `✨ ${xp} / ${xpNeeded}`, inline: true }
            )
            .setFooter({ text: "Parle dans le chat pour gagner de l'XP !" });

        // Calcul de la barre de progression (visuel sympa)
        let percentage = Math.floor((xp / xpNeeded) * 10);
        let bar = "🟩".repeat(percentage) + "⬜".repeat(10 - percentage);
        
        embed.addFields({ name: "Progression", value: bar, inline: false });

        await message.reply({ embeds: [embed] });
    }
}