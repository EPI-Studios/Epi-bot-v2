// Importation du module 'fs' pour lire les dossiers
const fs = require('fs');

module.exports = async bot => {

    // 1. On lit le dossier './src/Events/'
    // 2. On ne garde que les fichiers qui finissent par '.js'
    // 3. On boucle sur chaque fichier trouvé
    fs.readdirSync('./src/Events/').filter(f => f.endsWith('.js')).forEach(async file => {

        // On importe le fichier de l'événement (ex: ready.js)
        let event = require(`../Events/${file}`);

        // --- LA PARTIE MAGIQUE ---
        // file.split('.js')[0] : Prend le nom du fichier "ready.js", enlève ".js" pour obtenir "ready".
        // bot.on(...) : Dit au bot "Quand l'événement 'ready' arrive, lance la fonction".
        // event.bind(null, bot) : On "attache" la variable 'bot' à la fonction pour pouvoir l'utiliser dans le fichier de l'événement.
        bot.on(file.split('.js')[0], event.bind(null, bot));

        // Confirmation dans la console
        console.log(`Événement chargé : ${file}`);
    })
}