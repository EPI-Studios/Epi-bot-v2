// On importe discord.js pour créer l'embed et gérer les permissions
const Discord = require("discord.js")
// On importe 'fs' (File System) pour pouvoir lire et écrire dans le fichier presence.json
const fs = require("fs")

module.exports = {

    name: "appel",
    description: "Gérer la feuille de présence pour l'AG",
    // SECURITE : On bloque cette commande aux administrateurs uniquement.
    // Cela évite qu'un membre lambda ne lance ou n'arrête l'appel lui-même.
    permission: Discord.PermissionFlagsBits.Administrator, 
    dm: false, // Commande utilisable uniquement sur un serveur (pas en MP)
    
    // On utilise des SOUS-COMMANDES pour regrouper "debut" et "fin" dans une seule commande /appel
    options: [
        {
            type: "sub_command",
            name: "debut",
            description: "Ouvrir la feuille de présence (Efface la liste précédente)"
        },
        {
            type: "sub_command",
            name: "fin",
            description: "Clôturer l'appel et envoyer la liste dans les logs"
        }
    ],

    async run(bot, message, args) {

        // On regarde quelle sous-commande a été choisie par l'admin ('debut' ou 'fin')
        const subCommand = args.getSubcommand();
        // Le fichier où on stocke la liste temporaire des présents
        const file = "./presence.json";

        // ====================================================
        // 🟢 CAS 1 : DÉBUT DE L'APPEL
        // ====================================================
        if (subCommand === "debut") {
            
            // On prépare un objet "propre" pour commencer l'appel.
            // isOpen: true permet à la commande /present de fonctionner.
            // attendees: [] est une liste vide qui va se remplir d'IDs.
            let data = {
                isOpen: true,
                attendees: [] 
            };

            // On écrit cet objet dans le fichier (ce qui écrase l'appel précédent s'il y en avait un)
            fs.writeFileSync(file, JSON.stringify(data, null, 4));

            // On confirme à l'admin et aux membres que c'est parti
            await message.reply("📢 **L'appel est ouvert !**\nLes membres ayant le rôle `membres epi studio` peuvent maintenant taper `/present` pour confirmer leur présence.");
        }

        // ====================================================
        // 🔴 CAS 2 : FIN DE L'APPEL
        // ====================================================
        else if (subCommand === "fin") {

            // 1. Lecture du fichier
            let data = {};
            try { 
                // On essaie de lire le fichier presence.json pour voir qui a signé
                data = JSON.parse(fs.readFileSync(file, "utf8")); 
            } catch (err) {
                // Si le fichier n'existe pas (appel jamais lancé), on ne fait rien
            }

            // 2. Vérification : Si l'appel n'est pas ouvert, on arrête tout
            if (!data.isOpen) {
                return message.reply("Aucun appel n'est en cours.");
            }

            // 3. Fermeture de l'appel
            // On passe isOpen à false pour que la commande /present ne marche plus
            data.isOpen = false;
            fs.writeFileSync(file, JSON.stringify(data, null, 4));

            // 4. Transformation des IDs en Noms
            let attendeesList = data.attendees; // Liste brute des IDs (ex: ["987654...", "123456..."])
            let namesList = [];

            // On boucle sur chaque ID pour trouver le pseudo correspondant
            for (let userId of attendeesList) {
                // .cache.get() cherche le membre dans la mémoire du bot
                let member = message.guild.members.cache.get(userId);
                
                // Si on le trouve, on prend son Tag (Pseudo#0000), sinon on affiche l'ID
                namesList.push(member ? member.user.tag : `Utilisateur inconnu (${userId})`);
            }

            // 5. Création du rapport visuel (Embed)
            let embed = new Discord.EmbedBuilder()
                .setTitle("📋 Feuille de Présence (AG)")
                .setColor("Green")
                .setDescription(`L'appel est terminé.\n**Nombre de présents :** ${namesList.length}`)
                .addFields({
                    name: "Membres présents :",
                    // Si la liste n'est pas vide, on affiche les noms ligne par ligne (.join("\n"))
                    // Sinon on écrit "Personne n'était présent"
                    value: namesList.length > 0 ? namesList.join("\n") : "Personne n'était présent.",
                    inline: false
                })
                .setTimestamp();

            // 6. Envoi dans le salon des LOGS
            try {
                // On récupère l'ID du salon logs depuis logs.json
                let logsConfig = JSON.parse(fs.readFileSync("./logs.json", "utf8"));
                let logChannelId = logsConfig[message.guild.id];
                
                if (logChannelId) {
                    let logChannel = message.guild.channels.cache.get(logChannelId);
                    // Si le salon existe bien, on envoie l'embed dedans
                    if (logChannel) await logChannel.send({ embeds: [embed] });
                } else {
                    // Si pas de logs configurés, on prévient l'admin ici
                    await message.channel.send({ content: "⚠️ Pas de salon logs configuré, voici le résultat :", embeds: [embed] });
                }
            } catch (err) {
                // En cas d'erreur de lecture de logs.json
                await message.channel.send({ content: "Voici le résultat :", embeds: [embed] });
            }

            // Confirmation finale à l'admin
            await message.reply("✅ L'appel est clôturé et la liste a été envoyée.");
        }
    }
}