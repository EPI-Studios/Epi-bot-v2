const Discord = require("discord.js")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord.js");

module.exports = async bot => {

    let commands = []; // On crée une liste vide qui va contenir toutes les commandes formatées pour Discord

    // On parcourt toutes les commandes chargées précédemment dans la mémoire du bot (bot.commands)
    bot.commands.forEach(async command => {

        // On utilise le constructeur "SlashCommandBuilder" pour créer la structure officielle
        let slashcommand = new Discord.SlashCommandBuilder()
        .setName(command.name) // Le nom (ex: "ban")
        .setDescription(command.description) // La description
        .setDMPermission(command.dm) // Est-ce utilisable en MP ?
        // Gestion des permissions : Si c'est "Aucune", on met null (tout le monde). 
        // Sinon, on met la permission stricte (ex: BanMembers).
        .setDefaultMemberPermissions(command.permission === "Aucune" ? null : command.permission)

        // --- GESTION DES OPTIONS (La partie complexe) ---
        // Si la commande a des options (ex: un membre, une raison...)
        if(command.options?.length >= 1) {
            for(let i = 0; i < command.options.length; i++) {
                
                // Cette ligne est une astuce de programmation (Dynamisme) :
                // Elle construit le nom de la fonction à appeler selon le type d'option.
                // Si type = "user", ça devient slashcommand.addUserOption(...)
                // Si type = "string", ça devient slashcommand.addStringOption(...)
                // Elle prend la 1ère lettre du type, la met en majuscule, et rajoute le reste + "Option"
                slashcommand[`add${command.options[i].type.slice(0 ,1).toUpperCase() + command.options[i].type.slice(1, command.options[i].type.length)}Option`](option => option.setName(command.options[i].name).setDescription(command.options[i].description).setRequired(command.options[i].required))
            }
        }

        // On ajoute la commande finie dans la liste
        await commands.push(slashcommand);
    })

    // --- ENVOI A DISCORD ---
    
    // On prépare la connexion à l'API REST de Discord (v10) avec le token du bot
    const rest = new REST ({version: "10"}).setToken(bot.token)

    // On envoie la liste complète (commands) aux serveurs de Discord (PUT request)
    // Routes.applicationCommands(bot.user.id) signifie qu'on enregistre les commandes globalement (sur tous les serveurs)
    await rest.put(Routes.applicationCommands(bot.user.id), {body: commands})
    
    console.log("Les slash commandes sont créées avec succès !")
}