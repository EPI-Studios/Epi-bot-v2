const fs = require('fs');

module.exports = async bot => {

    // On lit le dossier racine "Commands"
    fs.readdirSync('./src/Commands/').forEach(async file => {

        // On vérifie les informations sur l'élément (est-ce un fichier ou un dossier ?)
        const path = `./src/Commands/${file}`;
        const stat = fs.lstatSync(path);

        // === CAS 1 : C'EST UN DOSSIER (ex: "AG", "Moderation") ===
        if (stat.isDirectory()) {
            // On lit le contenu de ce sous-dossier
            fs.readdirSync(path).filter(f => f.endsWith('.js')).forEach(async subFile => {
                
                // On importe le fichier qui est DANS le sous-dossier
                let command = require(`../Commands/${file}/${subFile}`);
                
                // Vérification de sécurité
                if(!command.name || typeof command.name !== 'string') throw new Error(`Erreur : La commande dans ${subFile} n'a pas de nom valide.`);
                
                // On charge la commande
                bot.commands.set(command.name, command);
                console.log(`Commande chargée (${file}) : ${command.name}`);
            });
        }
        
        // === CAS 2 : C'EST UN FICHIER DIRECT (ex: "ban.js", "ping.js") ===
        else if (file.endsWith('.js')) {
            // On importe le fichier qui est à la racine
            let command = require(`../Commands/${file}`);
            
            if(!command.name || typeof command.name !== 'string') throw new Error(`Erreur : La commande dans ${file} n'a pas de nom valide.`);
            
            bot.commands.set(command.name, command);
            console.log(`📄 Commande chargée : ${command.name}`);
        }
    });
}