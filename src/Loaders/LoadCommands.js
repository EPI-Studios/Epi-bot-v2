// On importe le module 'fs' (File System) qui permet de lire les dossiers et fichiers de ton ordinateur
const fs = require('fs');

module.exports = async bot => {

    // 1. fs.readdirSync : Lit le contenu du dossier './src/Commands/'
    // 2. .filter : On ne garde que les fichiers qui finissent par ".js" (pour éviter de charger des images ou des fichiers textes par erreur)
    // 3. .forEach : Pour chaque fichier trouvé, on exécute le code entre accolades
    fs.readdirSync('./src/Commands/').filter(f => f.endsWith('.js')).forEach(async file => {

        // On importe le fichier de commande (ex: ban.js)
        // Le `../Commands/${file}` remonte d'un dossier pour aller chercher le fichier
        let command = require(`../Commands/${file}`);

        // Vérification de sécurité :
        // Si le fichier n'a pas de nom (name: "ping") ou si ce n'est pas du texte, on arrête tout et on affiche une erreur.
        // Cela t'évite de lancer un bot buggé.
        if(!command.name || typeof command.name !== 'string') throw new Error(`Le fichier ${file} n'a pas de nom de commande valide (property .name).`);

        // C'est l'étape la plus importante :
        // On enregistre la commande dans la "Collection" du bot créée dans ton index.js (bot.commands)
        // La clé est le nom (ex: "ban") et la valeur est tout le code du fichier.
        bot.commands.set(command.name, command);

        // Confirmation visuelle dans la console que la commande est prête
        console.log(`Commande chargée : ${command.name}`);
    })
}