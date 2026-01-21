const Discord = require("discord.js")
const fs = require("fs")

module.exports = {

    name: "setlogs",
    description: "Définir le salon où seront envoyés les logs de modération",
    permission: Discord.PermissionFlagsBits.ManageGuild, // Il faut être admin pour toucher à ça
    dm: false,
    options: [
        {
            type: "channel",
            name: "salon",
            description: "Le salon pour les logs",
            required: true,
            channelTypes: [0] // 0 = Seulement les salons textuels (pas de vocal)
        }
    ],

    async run(bot, message, args) {

        try {
            // On récupère le salon choisi par l'utilisateur
            let channel = args.getChannel("salon")
            
            // Petite sécurité : on vérifie si le salon est valide
            if (!channel) return message.reply("Salon invalide ou introuvable.")

            // --- LECTURE DU FICHIER JSON ---
            let logs = {}
            try {
                // On essaie de lire le fichier s'il existe déjà
                logs = JSON.parse(fs.readFileSync("./logs.json", "utf8"))
            } catch (err) {
                // S'il n'existe pas, logs reste un objet vide {}
            }

            // --- SAUVEGARDE ---
            // On associe l'ID du serveur (Guild ID) à l'ID du salon choisi
            logs[message.guild.id] = channel.id

            // On écrit tout ça dans le fichier logs.json
            fs.writeFileSync("./logs.json", JSON.stringify(logs, null, 4))

            // --- CONFIRMATION ---
            await message.reply(`✅ Le salon des logs a bien été configuré sur ${channel} !`)
            
            // Petit test pour voir si le bot a bien le droit d'écrire dedans
            try {
                await channel.send(`📝 **Configuration réussie !** Les logs de modération (Ban, Kick, Mute, Warn) s'afficheront ici.`)
            } catch (err) {
                await message.followUp("⚠️ **Attention :** Je n'ai pas la permission d'écrire dans ce salon ! Vérifie mes permissions.")
            }

        } catch (err) {
            console.log(err)
            return message.reply("Une erreur est survenue lors de la sauvegarde.")
        }
    }
}