const fs = require('fs');

module.exports = async bot => {

    fs.readdirSync('./src/Commands/').filter(f => f.endsWith('.js')).forEach(async file => {

        let command = require(`../Commands/${file}`);
        if(!command.name || typeof command.name !== 'string') throw new Error(`Command in file ${file} is missing a valid name property.`);
        bot.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
    })}
