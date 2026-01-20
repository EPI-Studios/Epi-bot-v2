const discord = require('discord.js');

module.exports = async (bot , interaction) => {

        if(interaction.type === discord.InteractionType.ApplicationCommand){

            let command = require(`../Commands/${interaction.commandName}.js`);
            command.run(bot, interaction, interaction.options); 
        }
}