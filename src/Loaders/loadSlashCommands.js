const Discord = require("discord.js")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord.js");

module.exports = async bot => {

    let commands = [];

    bot.commands.forEach(async command => {

        let slashCommand = new Discord.SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description)
        .setDMPermission(command.dm)
        .setDefaultMemberPermissions(command.permission === "Aucune" ? null : command.permission)

        // Si la commande a des options
        if(command.options?.length >= 1) {
            for(let i = 0; i < command.options.length; i++) {
                const option = command.options[i];

                // === CAS 1 : C'EST UNE SOUS-COMMANDE (Ex: /clear tout) ===
                if (option.type === "sub_command") {
                    slashCommand.addSubcommand(subcommand => {
                        subcommand.setName(option.name).setDescription(option.description);
                        
                        // Si la sous-commande a elle-même des options (Ex: /clear quantite [nombre])
                        if (option.options && option.options.length > 0) {
                            for(let j = 0; j < option.options.length; j++) {
                                const subOption = option.options[j];
                                // On transforme "integer" en "addIntegerOption"
                                const typeFunc = `add${subOption.type.slice(0, 1).toUpperCase() + subOption.type.slice(1)}Option`;
                                
                                subcommand[typeFunc](op => 
                                    op.setName(subOption.name)
                                      .setDescription(subOption.description)
                                      .setRequired(subOption.required)
                                );
                            }
                        }
                        return subcommand;
                    });
                } 
                // === CAS 2 : C'EST UNE OPTION NORMALE (Ex: /ban [user]) ===
                else {
                    // On transforme "user" en "addUserOption", "string" en "addStringOption", etc.
                    const typeFunc = `add${option.type.slice(0, 1).toUpperCase() + option.type.slice(1)}Option`;
                    
                    slashCommand[typeFunc](op => 
                        op.setName(option.name)
                          .setDescription(option.description)
                          .setRequired(option.required)
                    );
                }
            }
        }

        await commands.push(slashCommand);
    })

    const rest = new REST({version: "10"}).setToken(bot.token)

    try {
        await rest.put(Routes.applicationCommands(bot.user.id), {body: commands})
        console.log("✅ Les slash commandes (et sous-commandes) sont créées avec succès !")
    } catch (err) {
        console.error("❌ Erreur lors de la création des commandes :", err);
    }
}