const fs = require('fs');

module.exports = async bot => {

    fs.readdirSync('./src/Events/').filter(f => f.endsWith('.js')).forEach(async file => {

        let event = require(`../Events/${file}`);
        bot.on(file.split('.js')[0], event.bind(null, bot));
        console.log(`Loaded event: ${file}`);
    })}