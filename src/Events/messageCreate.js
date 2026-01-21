const Discord = require("discord.js");
const fs = require("fs");

// On crée un "Cooldown" pour éviter que les gens spamment pour gagner de l'XP
// Ils ne gagneront de l'XP qu'une fois par minute maximum.
const cooldowns = new Set();

module.exports = async (bot, message) => {

    // 1. On ignore les bots et les messages privés
    if (message.author.bot || !message.guild) return;

    // --- SYSTEME D'XP ---

    // Vérification du Cooldown (Anti-Spam)
    if (cooldowns.has(message.author.id)) {
        return; // Si le membre est en cooldown, il ne gagne rien, on s'arrête là.
    }

    // On charge la base de données levels.json
    let db = {};
    try {
        db = JSON.parse(fs.readFileSync("./levels.json", "utf8"));
    } catch (err) {
        // Si le fichier n'existe pas, on part d'une base vide
    }

    // On prépare l'ID du membre
    let id = message.author.id;

    // Si le membre n'est pas dans la base, on l'ajoute (Niveau 1, 0 XP)
    if (!db[id]) {
        db[id] = { xp: 0, level: 1 };
    }

    // On donne un montant d'XP aléatoire entre 10 et 20
    let randomXp = Math.floor(Math.random() * 11) + 10;
    db[id].xp += randomXp;

    // On active le cooldown pour ce membre (1 minute = 60000 ms)
    cooldowns.add(message.author.id);
    setTimeout(() => {
        cooldowns.delete(message.author.id);
    }, 60000);


    // --- CALCUL DU NIVEAU ---
    // Formule simple : Il faut (Niveau actuel * 100) XP pour monter.
    // Ex: Niv 1 -> besoin de 100xp. Niv 2 -> besoin de 200xp.
    let xpNeeded = db[id].level * 100;

    if (db[id].xp >= xpNeeded) {
        
        // BRAVO ! MONTÉE DE NIVEAU
        db[id].xp -= xpNeeded; // On retire l'XP utilisée (ou on garde, selon ton choix. Ici on remet à 0 la barre)
        db[id].level++;        // On augmente le niveau

        let newLevel = db[id].level;

        // --- ANNONCE DANS LE SALON #BOTS ---
        
        // Condition demandée : Niveau 1 (ici on commence niv 1 donc le premier up est niv 2) 
        // OU tous les 5 niveaux (5, 10, 15...)
        // Note: Comme on commence niveau 1, le "premier palier" atteint est techniquement le niveau 2, ou alors le niveau 5 direct.
        // J'ai mis la condition : Si niveau == 2 (premier up) OU niveau est un multiple de 5.
        
        if (newLevel === 2 || newLevel % 5 === 0) {
            
            // On cherche le salon qui s'appelle "bots"
            let logChannel = message.guild.channels.cache.find(c => c.name === "bots");

            if (logChannel) {
                await logChannel.send(`🎉 Bravo ${message.author} ! Tu viens de passer au **Niveau ${newLevel}** !`);
            } else {
                // Si le salon "bots" n'existe pas, on envoie dans le salon actuel (optionnel)
                // await message.channel.send(`Bravo ${message.author}, tu es passé niveau ${newLevel} !`);
            }
        }
    }

    // On sauvegarde
    fs.writeFileSync("./levels.json", JSON.stringify(db, null, 4));
};